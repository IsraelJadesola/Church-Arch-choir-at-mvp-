import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 1. Removed 'role' from schema so frontend cannot dictate user rank
const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    voicePart: z.enum(['Soprano', 'Alto', 'Tenor', 'Bass'])
});

router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(data.password, salt);

        // 2. Hardcode role as 'member' and active as false
        await pool.query(
            `INSERT INTO users (name, email, password_hash, role, voice_part, active) 
             VALUES ($1, $2, $3, 'member', $4, false)`,
            [data.name, data.email, password_hash, data.voicePart]
        );

        // 3. Do NOT send a token back. Force them to wait for approval.
        res.status(201).json({ 
            message: 'Registration successful! Please wait for the Director to approve your account.' 
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required")
});

router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const dbUser = result.rows[0];
        const validPassword = await bcrypt.compare(data.password, dbUser.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // 4. Update rejection message for inactive accounts
        if (!dbUser.active) {
            return res.status(403).json({ error: 'Your account is pending Director approval.' });
        }

        const user = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            voicePart: dbUser.voice_part,
            active: dbUser.active
        };

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ user, token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: err.errors[0].message });
        }
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const dbUser = result.rows[0];

        // 5. Extra security: Boot them if they somehow stored an old token but were deactivated
        if (!dbUser.active) {
            return res.status(403).json({ error: 'Your account is pending Director approval.' });
        }

        const user = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            voicePart: dbUser.voice_part,
            active: dbUser.active
        };

        res.json({ user });
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Server error checking auth status' });
    }
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'No account with that email exists' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(resetToken, 10);
        const expireDate = new Date(Date.now() + 3600000); // 1 hour from now

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [tokenHash, expireDate, email]
        );

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}?email=${email}`;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Choir App - Password Reset Request',
            html: `<p>You requested a password reset.</p>
                   <p>Click this <a href="${resetUrl}">link to reset your password</a>.</p>
                   <p>If you did not request this, please ignore this email.</p>`
        });

        res.json({ message: 'Password reset link sent to your email' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Error sending reset email' });
    }
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    try {
        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND reset_token_expires > NOW()',
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Token is invalid or has expired' });
        }

        const isValid = await bcrypt.compare(token, user.rows[0].reset_token);
        if (!isValid) return res.status(400).json({ error: 'Invalid token' });

        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE email = $2',
            [newPasswordHash, email]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Error resetting password' });
    }
});

export default router;
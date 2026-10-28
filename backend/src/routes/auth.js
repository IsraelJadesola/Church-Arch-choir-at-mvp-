import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

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

export default router;
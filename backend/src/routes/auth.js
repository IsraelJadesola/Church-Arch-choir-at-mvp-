import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Only allow member or leader to sign up via the public form
const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    voicePart: z.enum(['Soprano', 'Alto', 'Tenor', 'Bass']),
    role: z.enum(['member', 'leader']) 
});

router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        
        // Check if user exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(data.password, salt);

        // Insert user into Neon database
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, voice_part) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, voice_part, active`,
            [data.name, data.email, password_hash, data.role, data.voicePart]
        );

        const dbUser = result.rows[0];
        // Format object exactly how frontend expects it
        const user = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            voicePart: dbUser.voice_part,
            active: dbUser.active
        };

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ user, token });
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

        if (!dbUser.active) {
            return res.status(403).json({ error: 'Account is deactivated' });
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
        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const dbUser = result.rows[0];
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
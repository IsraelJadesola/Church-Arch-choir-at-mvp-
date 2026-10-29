import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const announcementSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    type: z.string().default('General')
});

// Everyone can view announcements
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching announcements' });
    }
});

// Only Directors and Leaders can post
router.post('/', requireAuth, async (req, res) => {
    if (req.user.role !== 'director' && req.user.role !== 'leader' && req.user.role !== 'executive') {
        return res.status(403).json({ error: 'Not authorized to post announcements' });
    }
    try {
        const data = announcementSchema.parse(req.body);
        const result = await pool.query(
            `INSERT INTO announcements (title, content, type, author_name) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [data.title, data.content, data.type, req.user.name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        res.status(500).json({ error: 'Server error creating announcement' });
    }
});

// PUT (Edit) Route
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const check = await pool.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
        
        // Strict ownership check (Directors cannot edit other people's posts, only delete them)
        if (req.user.name !== check.rows[0].author_name) {
            return res.status(403).json({ error: 'You can only edit your own announcements' });
        }

        const data = announcementSchema.parse(req.body);
        const result = await pool.query(
            `UPDATE announcements SET title = $1, content = $2, type = $3 
             WHERE id = $4 RETURNING *`,
            [data.title, data.content, data.type, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        res.status(500).json({ error: 'Server error updating announcement' });
    }
});

// DELETE Route
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const check = await pool.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
        
        // Ownership check OR Director override
        if (req.user.name !== check.rows[0].author_name && req.user.role !== 'director') {
            return res.status(403).json({ error: 'You are not authorized to delete this announcement' });
        }

        await pool.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error deleting announcement' });
    }
});

export default router;
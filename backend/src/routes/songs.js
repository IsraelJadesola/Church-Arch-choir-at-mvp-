import express from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const songSchema = z.object({
    title: z.string().min(1, "Title is required"),
    composer: z.string().optional(),
    key: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    category: z.string().default('Uncategorized')
});

router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM songs ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching songs' });
    }
});

router.post('/', requireAuth, requireRole('director'), upload.single('file'), async (req, res) => {
    try {
        const data = songSchema.parse(req.body);
        const fileUrl = req.file ? req.file.path : null;
        const fileType = req.file ? req.file.mimetype : null;

        const result = await pool.query(
            `INSERT INTO songs (title, composer, key, status, notes, category, file_url, file_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [data.title, data.composer, data.key, data.status, data.notes, data.category, fileUrl, fileType]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        console.error('Song upload error:', err);
        res.status(500).json({ error: 'Server error adding song' });
    }
});

router.put('/:id', requireAuth, requireRole('director'), upload.single('file'), async (req, res) => {
    try {
        const data = songSchema.parse(req.body);
        let result;

        if (req.file) {
            result = await pool.query(
                `UPDATE songs SET title = $1, composer = $2, key = $3, status = $4, notes = $5, category = $6, file_url = $7, file_type = $8 WHERE id = $9 RETURNING *`,
                [data.title, data.composer, data.key, data.status, data.notes, data.category, req.file.path, req.file.mimetype, req.params.id]
            );
        } else {
            result = await pool.query(
                `UPDATE songs SET title = $1, composer = $2, key = $3, status = $4, notes = $5, category = $6 WHERE id = $7 RETURNING *`,
                [data.title, data.composer, data.key, data.status, data.notes, data.category, req.params.id]
            );
        }

        if (result.rows.length === 0) return res.status(404).json({ error: 'Song not found' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        console.error('Song update error:', err);
        res.status(500).json({ error: 'Server error updating song' });
    }
});

router.delete('/:id', requireAuth, requireRole('director'), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM songs WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Song not found' });
        res.json({ message: 'Song deleted successfully' });
    } catch (err) {
        console.error('Song delete error:', err);
        res.status(500).json({ error: 'Server error deleting song' });
    }
});

export default router;
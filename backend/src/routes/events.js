import express from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const eventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    starts_at: z.string().min(1, "Start date and time are required"),
    type: z.string().default('Rehearsal'),
    description: z.string().optional()
});

// Fetch all events
router.get('/', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY starts_at ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching events' });
    }
});

// Fetch the logged-in user's RSVPs
router.get('/my-rsvps', requireAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT event_id, status FROM rsvps WHERE user_id = $1', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching RSVPs' });
    }
});

// Submit or Update an RSVP
router.post('/:id/rsvp', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const eventId = req.params.id;
        const userId = req.user.id;

        const result = await pool.query(
            `INSERT INTO rsvps (event_id, user_id, status) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (event_id, user_id) 
             DO UPDATE SET status = $3 RETURNING *`,
            [eventId, userId, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error saving RSVP' });
    }
});

// Create new event (Director only)
router.post('/', requireAuth, requireRole('director'), async (req, res) => {
    try {
        const data = eventSchema.parse(req.body);
        const result = await pool.query(
            `INSERT INTO events (title, starts_at, type, description) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [data.title, data.starts_at, data.type, data.description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        res.status(500).json({ error: 'Server error creating event' });
    }
});

// Delete event (Director only)
router.delete('/:id', requireAuth, requireRole('director'), async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error deleting event' });
    }
});

export default router;
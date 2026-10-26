import express from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get the setlist for a specific event
router.get('/:eventId', requireAuth, async (req, res) => {
    try {
        const query = `
            SELECT sp.id, sp.event_id, sp.song_id, sp.lead_vocalist, sp.sequence_order,
                   s.title, s.key as musical_key, s.category
            FROM service_plans sp
            JOIN songs s ON sp.song_id = s.id
            WHERE sp.event_id = $1
            ORDER BY sp.sequence_order ASC, sp.created_at ASC;
        `;
        const result = await pool.query(query, [req.params.eventId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching service plan' });
    }
});

// Add a song to an event's setlist (Director/Leader)
router.post('/', requireAuth, async (req, res) => {
    if (req.user.role === 'member') return res.status(403).json({ error: 'Not authorized' });
    const { event_id, song_id, lead_vocalist } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO service_plans (event_id, song_id, lead_vocalist) 
             VALUES ($1, $2, $3) RETURNING *`,
            [event_id, song_id, lead_vocalist]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding song to plan' });
    }
});

// Remove a song from the setlist
router.delete('/:id', requireAuth, async (req, res) => {
    if (req.user.role === 'member') return res.status(403).json({ error: 'Not authorized' });
    try {
        await pool.query('DELETE FROM service_plans WHERE id = $1', [req.params.id]);
        res.json({ message: 'Removed from setlist' });
    } catch (err) {
        res.status(500).json({ error: 'Server error deleting from plan' });
    }
});

export default router;
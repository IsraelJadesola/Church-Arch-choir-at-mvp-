import express from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Fetch RSVP report (Director only)
router.get('/rsvps', requireAuth, requireRole('director'), async (req, res) => {
    try {
        const query = `
            SELECT 
                e.id as event_id, e.title, e.starts_at, e.type,
                u.name, u.role, r.status
            FROM events e
            LEFT JOIN rsvps r ON e.id = r.event_id
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY e.starts_at DESC;
        `;
        const result = await pool.query(query);
        
        // Group data by event
        const eventsMap = {};
        result.rows.forEach(row => {
            if (!eventsMap[row.event_id]) {
                eventsMap[row.event_id] = {
                    id: row.event_id,
                    title: row.title,
                    starts_at: row.starts_at,
                    type: row.type,
                    going: [],
                    not_going: []
                };
            }
            if (row.name && row.status === 'going') {
                eventsMap[row.event_id].going.push({ name: row.name, role: row.role });
            } else if (row.name && row.status === 'not_going') {
                eventsMap[row.event_id].not_going.push({ name: row.name, role: row.role });
            }
        });

        res.json(Object.values(eventsMap));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching reports' });
    }
});

export default router;
import express from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

// GET /api/users - Directors and Excos can view all members
router.get('/', requireAuth, requireRole('director', 'leader'), async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, voice_part, active, created_at FROM users ORDER BY name ASC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
});

// DELETE /api/users/:id - Only Directors can delete standard members
router.delete('/:id', requireAuth, requireRole('director'), async (req, res) => {
  const targetUserId = req.params.id;

  try {
    // Check the rank of the user being deleted
    const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [targetUserId]);
    
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Block deletion if the target is an Exco (leader) or Director
    if (targetUser.rows[0].role !== 'member') {
      return res.status(403).json({ message: 'You can only delete standard member accounts.' });
    }

    // Delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [targetUserId]);
    res.json({ message: 'Member deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/users/:id/role - Only Directors can change roles
const roleSchema = z.object({
    role: z.enum(['member', 'leader', 'director'])
});

router.patch('/:id/role', requireAuth, requireRole('director'), async (req, res) => {
    try {
        const { role } = roleSchema.parse(req.body);
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, role',
            [role, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
        console.error('Error updating role:', err);
        res.status(500).json({ error: 'Server error updating role' });
    }
});

export default router;
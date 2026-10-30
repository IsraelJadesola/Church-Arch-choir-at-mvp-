import express from 'express';
import bcrypt from 'bcrypt';
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

// PATCH /api/users/:id/voice-part - Only Directors can change voice parts
router.patch('/:id/voice-part', requireAuth, requireRole('director'), async (req, res) => {
    const { voicePart } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET voice_part = $1 WHERE id = $2 RETURNING *',
            [voicePart, req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating voice part' });
    }
});

// PATCH /api/users/:id/approve - Only Directors can approve new accounts
router.patch('/:id/approve', requireAuth, requireRole('director'), async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE users SET active = true WHERE id = $1 RETURNING id, name, active',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User approved successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error approving user:', err);
        res.status(500).json({ error: 'Server error approving user' });
    }
});

// PUT /api/users/profile - Update personal info
router.put('/profile', requireAuth, async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
      [name, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// PUT /api/users/password - Update password
router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    // Fetch the user's current hashed password
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    // Verify current password matches
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) return res.status(400).json({ message: 'Invalid current password' });

    // Hash the new password and save it
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

export default router;
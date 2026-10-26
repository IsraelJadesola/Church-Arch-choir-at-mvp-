import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch the full user from the database so we have access to their exact role
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = result.rows[0];
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// This checks if the fetched user's role matches the required roles for the route
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Not allowed' });
        }
        next();
    };
};
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { pool } from './db.js'
import authRoutes from './routes/auth.js'
import eventsRoutes from './routes/events.js'
import songsRoutes from './routes/songs.js'
import usersRoutes from './routes/users.js'
import announcementsRoutes from './routes/announcements.js'
import reportsRoutes from './routes/reports.js'
import plannerRoutes from './routes/planner.js'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/songs', songsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/planner', plannerRoutes)

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ status: 'ok', dbTime: result.rows[0].now })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
})

// Only run the server locally. Vercel will handle the routing in production.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
import fs from 'fs'
import { pool } from './db.js'

const sql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

try {
  await pool.query(sql)
  console.log('Tables created')
} catch (err) {
  console.error('Migration failed:', err.message)
} finally {
  await pool.end()
}
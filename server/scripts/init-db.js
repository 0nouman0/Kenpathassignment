import { createPool, initSchema } from '../src/db.js'

const pool = createPool()
await initSchema(pool)
console.log('Database schema is ready.')
await pool.end()

import { Pool, types } from 'pg'
import bcrypt from 'bcryptjs'

// Parse DATE columns (OID 1082) as exact YYYY-MM-DD strings
types.setTypeParser(1082, (str) => str)

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety'

let pool = null
let useMemoryFallback = false
let memStore = null
let warnedFallback = false

function logMemoryWarning(reason) {
  if (warnedFallback) return
  warnedFallback = true
  console.warn(`
======================================================================
[SWEETY DATA PERSISTENCE WARNING]
PostgreSQL database is currently unreachable (${reason || 'Connection refused'}).
Operating in IN-MEMORY MODE with realistic pre-seeded clinical data.
Readings and updates will NOT persist across server restarts.
To persist data permanently, configure a running PostgreSQL instance in .env
======================================================================
  `)
}

// Fallback in-memory database store for instant developer preview if PostgreSQL is not running
function getMemoryStore() {
  if (memStore) return memStore

  const passwordHash = bcrypt.hashSync('Demo1234!', 10)
  const users = [
    {
      id: 1,
      name: 'Mohammed (Demo Patient)',
      email: 'demo@sweety.app',
      password_hash: passwordHash,
      role: 'patient',
      timezone: 'UTC',
      created_at: new Date().toISOString(),
    },
  ]

  // Seed 60 days of historical data for demo user
  const readings = []
  let readingId = 1
  const today = new Date()
  const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']

  for (let d = 59; d >= 0; d--) {
    const curDate = new Date(today)
    curDate.setDate(curDate.getDate() - d)
    const dateStr = curDate.toISOString().slice(0, 10)

    // Random 2 to 4 readings per day
    const numReadings = Math.floor(Math.random() * 3) + 2 // 2, 3, or 4
    const daySlots = [...slots].slice(0, numReadings)

    for (const slot of daySlots) {
      let base = 95
      let spread = 25
      if (slot === 'morning_fasting') {
        base = 85
        spread = 20
      } else if (slot === 'after_lunch') {
        base = 135
        spread = 35
      } else if (slot === 'after_dinner') {
        base = 140
        spread = 40
      }

      const val = Math.min(260, Math.max(58, Math.round(base + (Math.random() * spread * 2 - spread))))

      readings.push({
        id: readingId++,
        user_id: 1,
        reading_date: dateStr,
        time_slot: slot,
        value_mgdl: val,
        created_at: new Date(curDate).toISOString(),
      })
    }
  }

  memStore = { users, readings, nextUserId: 2, nextReadingId: readingId }
  return memStore
}

export async function getDbPool() {
  if (useMemoryFallback) return null
  if (pool) return pool

  try {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 2000,
    })

    // Test connection with 2 second timeout
    await pool.query('SELECT 1')
    await initPostgresSchema(pool)
    return pool
  } catch (err) {
    logMemoryWarning(err.message)
    useMemoryFallback = true
    pool = null
    return null
  }
}

async function initPostgresSchema(p) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'patient',
      timezone VARCHAR(50) DEFAULT 'UTC',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reading_date DATE NOT NULL,
      time_slot VARCHAR(30) NOT NULL CHECK (time_slot IN ('morning_fasting','after_breakfast','after_lunch','after_dinner')),
      value_mgdl INTEGER NOT NULL CHECK (value_mgdl BETWEEN 40 AND 600),
      notes VARCHAR(200),
      tags TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_user_date_slot UNIQUE (user_id, reading_date, time_slot)
    );

    CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, reading_date);
  `)

  // Check if demo user exists
  const check = await p.query("SELECT id FROM users WHERE email = 'demo@sweety.app'")
  if (check.rows.length === 0) {
    const passwordHash = await bcrypt.hash('Demo1234!', 10)
    const userRes = await p.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      ['Mohammed (Demo Patient)', 'demo@sweety.app', passwordHash]
    )
    const demoId = userRes.rows[0].id

    // Seed 60 days
    const today = new Date()
    const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']

    for (let d = 59; d >= 0; d--) {
      const curDate = new Date(today)
      curDate.setDate(curDate.getDate() - d)
      const dateStr = curDate.toISOString().slice(0, 10)
      const numReadings = Math.floor(Math.random() * 3) + 2
      const daySlots = [...slots].slice(0, numReadings)

      for (const slot of daySlots) {
        let base = slot === 'morning_fasting' ? 85 : 135
        const val = Math.min(260, Math.max(60, Math.round(base + (Math.random() * 50 - 25))))
        await p.query(
          "INSERT INTO readings (user_id, reading_date, time_slot, value_mgdl) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
          [demoId, dateStr, slot, val]
        )
      }
    }
  }
}

/**
 * Returns current database backend mode
 */
export async function getDbStatus() {
  const p = await getDbPool()
  return p ? 'postgres' : 'memory'
}

/**
 * Universal transaction wrapper for atomic database operations
 */
export async function withTransaction(callback) {
  const p = await getDbPool()
  if (p) {
    const client = await p.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  // Fallback memory engine (atomic in single-threaded event loop)
  return callback({ query })
}

/**
 * Universal query helper that automatically handles PostgreSQL or resilient local memory store
 */
export async function query(sqlText, params = []) {
  const p = await getDbPool()
  if (p) {
    return p.query(sqlText, params)
  }

  // Memory fallback query engine
  const store = getMemoryStore()
  const lower = sqlText.toLowerCase()

  // 1. SELECT user by email
  if (lower.includes('from users where email = $1')) {
    const user = store.users.find((u) => u.email.toLowerCase() === String(params[0]).toLowerCase())
    return { rows: user ? [{ ...user }] : [] }
  }

  // 2. INSERT into users
  if (lower.includes('insert into users')) {
    const id = store.nextUserId++
    const user = {
      id,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: 'patient',
      timezone: params[3] || 'UTC',
      created_at: new Date().toISOString(),
    }
    store.users.push(user)
    return { rows: [{ id: user.id, name: user.name, email: user.email, role: user.role, timezone: user.timezone, created_at: user.created_at }] }
  }

  // 3. SELECT user by id
  if (lower.includes('from users where id = $1')) {
    const user = store.users.find((u) => u.id === Number(params[0]))
    return { rows: user ? [{ ...user }] : [] }
  }

  // 4. Count readings for user on date
  if (lower.includes('select count(*) from readings where user_id = $1 and reading_date = $2')) {
    const count = store.readings.filter(
      (r) => r.user_id === Number(params[0]) && r.reading_date === params[1]
    ).length
    return { rows: [{ count: String(count) }] }
  }

  // 5. Check duplicate slot
  if (lower.includes('select id from readings where user_id = $1 and reading_date = $2 and time_slot = $3')) {
    const excludeId = params[3] ? Number(params[3]) : null
    const match = store.readings.find(
      (r) => r.user_id === Number(params[0]) &&
             r.reading_date === params[1] &&
             r.time_slot === params[2] &&
             (excludeId === null || r.id !== excludeId)
    )
    return { rows: match ? [{ id: match.id }] : [] }
  }

  // 6. INSERT reading
  if (lower.includes('insert into readings')) {
    const id = store.nextReadingId++
    const newReading = {
      id,
      user_id: Number(params[0]),
      reading_date: params[1],
      time_slot: params[2],
      value_mgdl: Number(params[3]),
      created_at: new Date().toISOString(),
    }
    store.readings.push(newReading)
    return { rows: [{ ...newReading }] }
  }

  // 7. UPDATE reading
  if (lower.includes('update readings set')) {
    const readingId = Number(params[3])
    const userId = Number(params[4])
    const idx = store.readings.findIndex((r) => r.id === readingId && r.user_id === userId)
    if (idx !== -1) {
      store.readings[idx] = {
        ...store.readings[idx],
        reading_date: params[0],
        time_slot: params[1],
        value_mgdl: Number(params[2]),
      }
      return { rows: [{ ...store.readings[idx] }] }
    }
    return { rows: [] }
  }

  // 8. DELETE reading
  if (lower.includes('delete from readings where id = $1 and user_id = $2')) {
    const id = Number(params[0])
    const userId = Number(params[1])
    const idx = store.readings.findIndex((r) => r.id === id && r.user_id === userId)
    if (idx !== -1) {
      store.readings.splice(idx, 1)
      return { rows: [{ id }] }
    }
    return { rows: [] }
  }

  // 9. SELECT reading by id (ownership check)
  if (lower.includes('select id, user_id from readings where id = $1')) {
    const match = store.readings.find((r) => r.id === Number(params[0]))
    return { rows: match ? [{ id: match.id, user_id: match.user_id }] : [] }
  }

  // 10. Reports: between dates
  if (lower.includes('reading_date between $2 and $3')) {
    const userId = Number(params[0])
    const from = params[1]
    const to = params[2]
    const rows = store.readings
      .filter((r) => r.user_id === userId && r.reading_date >= from && r.reading_date <= to)
      .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    return { rows }
  }

  // 11. Reports: single date
  if (lower.includes('user_id = $1 and reading_date = $2')) {
    const userId = Number(params[0])
    const date = params[1]
    const rows = store.readings
      .filter((r) => r.user_id === userId && r.reading_date === date)
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    return { rows }
  }

  // 12. General paginated list
  if (lower.includes('select id, user_id, reading_date, time_slot, value_mgdl, created_at from readings where user_id = $1')) {
    const userId = Number(params[0])
    let filtered = store.readings.filter((r) => r.user_id === userId)
    let pIdx = 1

    if (params.length > 1 && typeof params[1] === 'string' && params[1].includes('-')) {
      filtered = filtered.filter((r) => r.reading_date === params[1])
      pIdx++
    }

    filtered.sort((a, b) => b.reading_date.localeCompare(a.reading_date))

    const limit = Number(params[pIdx]) || 20
    const offset = Number(params[pIdx + 1]) || 0
    const rows = filtered.slice(offset, offset + limit)
    return { rows }
  }

  // 13. General count
  if (lower.includes('select count(*) from readings where user_id = $1')) {
    const userId = Number(params[0])
    let filtered = store.readings.filter((r) => r.user_id === userId)
    if (params.length > 1 && typeof params[1] === 'string' && params[1].includes('-')) {
      filtered = filtered.filter((r) => r.reading_date === params[1])
    }
    return { rows: [{ count: String(filtered.length) }] }
  }

  return { rows: [] }
}

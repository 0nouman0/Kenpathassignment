import bcrypt from 'bcryptjs'
import { createPool, initSchema } from '../src/db.js'
import { todayIn } from '../src/lib/dates.js'

const DEMO_USER = { name: 'Demo Patient', email: 'demo@sweety.app', password: 'Demo1234!' }

const SLOTS = [
  { slot: 'morning', base: 98, spread: 18 },
  { slot: 'after_breakfast', base: 142, spread: 30 },
  { slot: 'after_lunch', base: 150, spread: 35 },
  { slot: 'after_dinner', base: 138, spread: 32 },
]

// Small deterministic generator so the demo data looks the same on every run.
function makeRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function shiftDate(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const pool = createPool()
await initSchema(pool)

const hash = await bcrypt.hash(DEMO_USER.password, 10)
const { rows } = await pool.query(
  `INSERT INTO users (name, email, password_hash, timezone)
   VALUES ($1, $2, $3, 'UTC')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
   RETURNING id`,
  [DEMO_USER.name, DEMO_USER.email, hash]
)
const userId = rows[0].id
await pool.query('DELETE FROM readings WHERE user_id = $1', [userId])

// About 70 days of history, so the daily, month-to-date and previous-month reports all have data.
const random = makeRandom(42)
const today = todayIn('UTC')
let inserted = 0
for (let back = 0; back < 70; back++) {
  const date = shiftDate(today, -back)
  // Some days are only partly logged, which is realistic. Today is left half empty on purpose.
  const logged = back === 0 ? 2 : random() < 0.6 ? 4 : 2 + Math.floor(random() * 2)
  for (const { slot, base, spread } of SLOTS.slice(0, logged)) {
    const value = Math.round(base + (random() * 2 - 1) * spread)
    await pool.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value_mgdl)
       VALUES ($1, $2, $3, $4)`,
      [userId, date, slot, Math.min(600, Math.max(40, value))]
    )
    inserted++
  }
}

console.log(`Seeded ${DEMO_USER.email} / ${DEMO_USER.password} with ${inserted} readings.`)
await pool.end()

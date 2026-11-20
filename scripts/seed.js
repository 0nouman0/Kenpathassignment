import { query } from '../src/lib/db.js'

async function runSeed() {
  console.log('Seeding demo patient account and 60 days of glucose readings...')
  // getDbPool in db.js automatically initializes schema and seeds demo@sweety.app / Demo1234!
  const res = await query('SELECT count(*) FROM users')
  const readingsRes = await query('SELECT count(*) FROM readings')
  console.log(`✅ Seed complete! Users: ${res.rows[0].count}, Total Readings: ${readingsRes.rows[0].count}`)
  console.log('Credentials: demo@sweety.app / Demo1234!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('Seed error:', err)
  process.exit(1)
})

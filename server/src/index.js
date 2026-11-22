import { config } from './config.js'
import { createPool, initSchema } from './db.js'
import { createApp } from './app.js'

const pool = createPool()

try {
  await initSchema(pool)
} catch (err) {
  const reason = err.message || err.errors?.[0]?.message || err.code || 'unknown error'
  console.error(`Could not connect to PostgreSQL: ${reason}`)
  console.error('Check DATABASE_URL in your .env file and that PostgreSQL is running.')
  process.exit(1)
}

createApp(pool).listen(config.port, () => {
  console.log(`Sweety API listening on http://localhost:${config.port}`)
})

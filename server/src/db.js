import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { config } from './config.js'

// Return DATE columns as "YYYY-MM-DD" strings instead of JS Dates (avoids timezone shifts).
pg.types.setTypeParser(1082, (value) => value)

const here = path.dirname(fileURLToPath(import.meta.url))
export const schemaPath = path.join(here, '..', 'db', 'schema.sql')

export function createPool() {
  return new pg.Pool({ connectionString: config.databaseUrl })
}

export async function initSchema(pool) {
  await pool.query(fs.readFileSync(schemaPath, 'utf8'))
}

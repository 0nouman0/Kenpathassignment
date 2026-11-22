import { newDb } from 'pg-mem'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { schemaPath } from '../src/db.js'
import fs from 'node:fs'

/** A fresh in-memory Postgres (via pg-mem) with the real schema, and an app wired to it. */
export async function createTestApp() {
  const db = newDb()
  const { Pool } = db.adapters.createPg()
  const pool = new Pool()
  await pool.query(fs.readFileSync(schemaPath, 'utf8'))
  return { app: createApp(pool), pool }
}

/** Registers a user and returns a supertest agent that carries their login cookie. */
export async function signUp(app, overrides = {}) {
  const agent = request.agent(app)
  const body = {
    name: 'Test Patient',
    email: `user${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    timezone: 'UTC',
    ...overrides,
  }
  const res = await agent.post('/api/auth/register').send(body)
  if (res.status !== 201) throw new Error(`signUp failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { agent, user: res.body.user, credentials: body }
}

export function isoDate(daysAgo = 0) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

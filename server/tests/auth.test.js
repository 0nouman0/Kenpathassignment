import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp, signUp } from './helpers.js'

let app, pool
beforeEach(async () => {
  ;({ app, pool } = await createTestApp())
})

describe('auth', () => {
  it('registers a user and never stores the plain-text password', async () => {
    const { user } = await signUp(app, { email: 'a@example.com', password: 'secret-pass-1' })
    expect(user.email).toBe('a@example.com')

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user.id])
    expect(rows[0].password_hash).not.toContain('secret-pass-1')
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/) // bcrypt
  })

  it('rejects a duplicate email', async () => {
    await signUp(app, { email: 'dup@example.com' })
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'DUP@example.com', password: 'password123' })
    expect(res.status).toBe(409)
  })

  it('validates registration input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'not-an-email', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.field).toBe('email')

    const short = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: 'short' })
    expect(short.body.field).toBe('password')
  })

  it('logs in with the right password and rejects the wrong one', async () => {
    const { credentials } = await signUp(app)
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
    expect(ok.status).toBe(200)
    expect(ok.headers['set-cookie'][0]).toMatch(/HttpOnly/i)

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })
    expect(bad.status).toBe(401)
  })

  it('protects routes that need a login', async () => {
    expect((await request(app).get('/api/readings')).status).toBe(401)
    expect((await request(app).get('/api/reports/daily?date=2026-01-01')).status).toBe(401)
  })
})

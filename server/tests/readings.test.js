/**
 * Readings + Reports tests
 * Uses supertest against the Express app.
 * Requires TEST_DATABASE_URL env var pointing to a real PostgreSQL test DB.
 */

require('dotenv').config();
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');

const UNIQUE_SUFFIX = Date.now();
const TEST_EMAIL = `readuser_${UNIQUE_SUFFIX}@sweety.app`;
const TEST_PASSWORD = 'ReadPass1234!';

let authToken;
let testUserId;
let createdReadingId;

// A past date that will never be in the future
const PAST_DATE = '2024-01-15';

beforeAll(async () => {
  // Ensure schema
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'patient',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS readings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reading_date DATE NOT NULL,
      time_slot VARCHAR(30) NOT NULL CHECK (time_slot IN ('morning_fasting','after_breakfast','after_lunch','after_dinner')),
      value_mgdl INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, reading_date, time_slot)
    )
  `);

  // Register & login to get a token
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Read Tester',
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  expect(regRes.statusCode).toBe(201);
  authToken = regRes.body.token;
  testUserId = regRes.body.user.id;

  // Clean any old readings for this user and date to ensure clean state
  await db.query(`DELETE FROM readings WHERE user_id = $1`, [testUserId]);
});

afterAll(async () => {
  await db.query(`DELETE FROM users WHERE email LIKE 'readuser_%@sweety.app'`);
  await db.pool.end();
});

// ── POST /api/readings ────────────────────────────────────────────────────────

describe('POST /api/readings', () => {
  it('creates a reading with valid data', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'morning_fasting',
        value_mgdl: 95,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      time_slot: 'morning_fasting',
      value_mgdl: 95,
    });
    createdReadingId = res.body.id;
  });

  it('rejects a future date', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const futureDate = future.toISOString().slice(0, 10);

    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: futureDate,
        time_slot: 'after_lunch',
        value_mgdl: 120,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/future/i);
  });

  it('rejects an out-of-range value (too low)', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'after_breakfast',
        value_mgdl: 10,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/40|600|integer/i);
  });

  it('rejects an out-of-range value (too high)', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'after_lunch',
        value_mgdl: 999,
      });

    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid time_slot', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'midnight_snack',
        value_mgdl: 110,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/time_slot/i);
  });

  it('rejects a duplicate slot on the same day', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'morning_fasting', // duplicate
        value_mgdl: 100,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already have|already exists/i);
  });
});

// ── GET /api/readings ─────────────────────────────────────────────────────────

describe('GET /api/readings', () => {
  it('returns paginated readings', async () => {
    const res = await request(app)
      .get('/api/readings?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('filters readings by date', async () => {
    const res = await request(app)
      .get(`/api/readings?date=${PAST_DATE}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.forEach((r) => {
      expect(r.reading_date).toBe(PAST_DATE);
    });
  });
});

// ── PUT /api/readings/:id ─────────────────────────────────────────────────────

describe('PUT /api/readings/:id', () => {
  it('updates an existing reading', async () => {
    const res = await request(app)
      .put(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'morning_fasting',
        value_mgdl: 105,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.value_mgdl).toBe(105);
  });

  it('returns 404 for non-existent reading', async () => {
    const res = await request(app)
      .put('/api/readings/999999999')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        reading_date: PAST_DATE,
        time_slot: 'after_breakfast',
        value_mgdl: 120,
      });

    expect(res.statusCode).toBe(404);
  });
});

// ── Reports ───────────────────────────────────────────────────────────────────

describe('GET /api/reports/daily', () => {
  it('returns daily report with stats and readings array', async () => {
    const res = await request(app)
      .get(`/api/reports/daily?date=${PAST_DATE}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('dateRange');
    expect(res.body.dateRange.from).toBe(PAST_DATE);
    expect(res.body.dateRange.to).toBe(PAST_DATE);
    expect(res.body).toHaveProperty('stats');
    expect(res.body).toHaveProperty('readings');
    expect(Array.isArray(res.body.readings)).toBe(true);

    const { stats } = res.body;
    expect(stats).toHaveProperty('highest');
    expect(stats).toHaveProperty('lowest');
    expect(stats).toHaveProperty('average');
    expect(stats).toHaveProperty('count');
  });
});

describe('GET /api/reports/month-to-date', () => {
  it('returns month-to-date report', async () => {
    const res = await request(app)
      .get(`/api/reports/month-to-date?date=${PAST_DATE}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.dateRange.from).toBe('2024-01-01');
    expect(res.body.dateRange.to).toBe(PAST_DATE);
    expect(res.body).toHaveProperty('stats');
    expect(res.body).not.toHaveProperty('readings'); // only daily has readings array
  });
});

describe('GET /api/reports/monthly', () => {
  it('returns previous month report', async () => {
    const res = await request(app)
      .get(`/api/reports/monthly?date=${PAST_DATE}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('dateRange');
    expect(res.body).toHaveProperty('stats');
    // PAST_DATE is 2024-01-15 → previous month is 2023-12
    expect(res.body.dateRange.from).toBe('2023-12-01');
    expect(res.body.dateRange.to).toBe('2023-12-31');
  });
});

// ── DELETE /api/readings/:id ──────────────────────────────────────────────────

describe('DELETE /api/readings/:id', () => {
  it('deletes the reading created in this test suite', async () => {
    const res = await request(app)
      .delete(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 404 when deleting an already-deleted reading', async () => {
    const res = await request(app)
      .delete(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(404);
  });
});

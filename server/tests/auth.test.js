/**
 * Auth tests: register & login flow
 * Uses supertest against the Express app.
 * Requires TEST_DATABASE_URL env var pointing to a real PostgreSQL test DB.
 */

require('dotenv').config();
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');

const UNIQUE_SUFFIX = Date.now();
const TEST_EMAIL = `testuser_${UNIQUE_SUFFIX}@sweety.app`;
const TEST_PASSWORD = 'TestPass1234!';
const TEST_NAME = 'Test User';

let authToken;

beforeAll(async () => {
  // Ensure the test schema exists
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
});

afterAll(async () => {
  // Clean up test user(s) created during this run
  await db.query(`DELETE FROM users WHERE email LIKE 'testuser_%@sweety.app'`);
  await db.pool.end();
});

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ email: TEST_EMAIL, name: TEST_NAME });
    expect(res.body.user).not.toHaveProperty('password_hash');

    authToken = res.body.token;
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects missing name', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `nomissing_${UNIQUE_SUFFIX}@sweety.app`,
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short',
      email: `short_${UNIQUE_SUFFIX}@sweety.app`,
      password: 'abc',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Bad Email',
      email: 'not-an-email',
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_EMAIL,
      password: 'WrongPass999!',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@sweety.app',
      password: TEST_PASSWORD,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Protected routes without token', () => {
  it('GET /api/readings returns 401', async () => {
    const res = await request(app).get('/api/readings');
    expect(res.statusCode).toBe(401);
  });
});

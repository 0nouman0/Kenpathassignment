/**
 * Seed script for Sweety Blood Glucose Tracker.
 *
 * Creates:
 *  - Demo user: demo@sweety.app / Demo1234!
 *  - 60 days of realistic glucose readings (2–4 per day)
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: node db/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TIME_SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

/** Random integer in [min, max] */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Realistic glucose ranges per time slot (mg/dL).
 * Fasting slightly lower; post-meal spikes higher.
 */
const SLOT_RANGES = {
  morning_fasting:  { min: 80,  max: 140 },
  after_breakfast:  { min: 110, max: 220 },
  after_lunch:      { min: 100, max: 210 },
  after_dinner:     { min: 95,  max: 205 },
};

/**
 * Shuffle array in place (Fisher-Yates).
 */
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Returns YYYY-MM-DD for `daysAgo` days before today.
 */
const dateForDay = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Upsert demo user ───────────────────────────────────────────────────
    const DEMO_EMAIL = 'demo@sweety.app';
    const DEMO_PASSWORD = 'Demo1234!';
    const DEMO_NAME = 'Demo Patient';

    let userRes = await client.query('SELECT id FROM users WHERE email = $1', [DEMO_EMAIL]);

    let userId;
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log(`ℹ  Demo user already exists (id=${userId}). Skipping user creation.`);
    } else {
      const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
      userRes = await client.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3) RETURNING id`,
        [DEMO_NAME, DEMO_EMAIL, hash]
      );
      userId = userRes.rows[0].id;
      console.log(`✅ Created demo user (id=${userId}) – ${DEMO_EMAIL}`);
    }

    // ── 2. Seed 60 days of readings ───────────────────────────────────────────
    let inserted = 0;
    let skipped = 0;

    for (let daysAgo = 60; daysAgo >= 1; daysAgo--) {
      const date = dateForDay(daysAgo);
      const numReadings = randInt(2, 4);
      const slots = shuffle([...TIME_SLOTS]).slice(0, numReadings);

      for (const slot of slots) {
        const { min, max } = SLOT_RANGES[slot];
        const value = randInt(min, max);

        try {
          await client.query(
            `INSERT INTO readings (user_id, reading_date, time_slot, value_mgdl)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING`,
            [userId, date, slot, value]
          );
          inserted++;
        } catch {
          skipped++;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Seeded ${inserted} readings (${skipped} skipped – already exist).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed, rolling back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

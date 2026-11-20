-- Sweety Blood Glucose Tracker - Database Schema
-- Run with: psql $DATABASE_URL -f db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'patient',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  time_slot VARCHAR(30) NOT NULL CHECK (time_slot IN ('morning_fasting','after_breakfast','after_lunch','after_dinner')),
  value_mgdl INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, reading_date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, reading_date);

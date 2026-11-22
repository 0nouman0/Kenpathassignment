-- Sweety schema. Safe to run more than once.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  timezone      VARCHAR(64) NOT NULL DEFAULT 'UTC',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  time_slot    VARCHAR(20) NOT NULL
               CHECK (time_slot IN ('morning', 'after_breakfast', 'after_lunch', 'after_dinner')),
  value_mgdl   INTEGER NOT NULL CHECK (value_mgdl BETWEEN 40 AND 600),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One reading per slot per day. Also protects against two requests racing.
  CONSTRAINT readings_one_per_slot UNIQUE (user_id, reading_date, time_slot)
);

CREATE INDEX IF NOT EXISTS readings_user_date_idx ON readings (user_id, reading_date);

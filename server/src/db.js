require('dotenv').config();
const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');

types.setTypeParser(1082, (str) => str);

const isTest = process.env.NODE_ENV === 'test';
const connectionString = isTest
  ? process.env.TEST_DATABASE_URL
  : (process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sweety');

let pool = null;
let useMemoryFallback = false;
let memStore = null;

function getMemoryStore() {
  if (memStore) return memStore;

  const passwordHash = bcrypt.hashSync('Demo1234!', 10);
  const users = [
    {
      id: 1,
      name: 'Mohammed (Demo Patient)',
      email: 'demo@sweety.app',
      password_hash: passwordHash,
      role: 'patient',
      created_at: new Date().toISOString(),
    },
  ];

  const readings = [];
  let readingId = 1;
  const today = new Date();
  const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

  for (let d = 59; d >= 0; d--) {
    const curDate = new Date(today);
    curDate.setDate(curDate.getDate() - d);
    const dateStr = curDate.toISOString().slice(0, 10);
    const numReadings = Math.floor(Math.random() * 3) + 2;
    const daySlots = [...slots].slice(0, numReadings);

    for (const slot of daySlots) {
      let base = slot === 'morning_fasting' ? 85 : 135;
      const val = Math.min(260, Math.max(58, Math.round(base + (Math.random() * 50 - 25))));
      readings.push({
        id: readingId++,
        user_id: 1,
        reading_date: dateStr,
        time_slot: slot,
        value_mgdl: val,
        created_at: new Date(curDate).toISOString(),
      });
    }
  }

  memStore = { users, readings, nextUserId: 2, nextReadingId: readingId };
  return memStore;
}

function initPool() {
  if (pool) return pool;
  if (!connectionString) {
    useMemoryFallback = true;
    return null;
  }
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 1500,
  });

  pool.on('error', (err) => {
    console.warn('PostgreSQL idle client notice:', err.message);
  });
  return pool;
}

const query = async (text, params = []) => {
  if (!useMemoryFallback) {
    try {
      const p = initPool();
      if (p) {
        return await p.query(text, params);
      }
    } catch (err) {
      console.warn('⚠️ PostgreSQL unavailable, falling back to in-memory store:', err.message);
      useMemoryFallback = true;
    }
  }

  // Memory fallback query engine
  const store = getMemoryStore();
  const lower = text.toLowerCase();

  if (lower.includes('from users where email = $1')) {
    const user = store.users.find((u) => u.email.toLowerCase() === String(params[0]).toLowerCase());
    return { rows: user ? [{ ...user }] : [] };
  }

  if (lower.includes('insert into users')) {
    const id = store.nextUserId++;
    const user = {
      id,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: 'patient',
      created_at: new Date().toISOString(),
    };
    store.users.push(user);
    return { rows: [{ id: user.id, name: user.name, email: user.email, role: user.role }] };
  }

  if (lower.includes('from users where id = $1')) {
    const user = store.users.find((u) => u.id === Number(params[0]));
    return { rows: user ? [{ ...user }] : [] };
  }

  if (lower.includes('select count(*) from readings where user_id = $1 and reading_date = $2')) {
    const count = store.readings.filter(
      (r) => r.user_id === Number(params[0]) && r.reading_date === params[1]
    ).length;
    return { rows: [{ count: String(count) }] };
  }

  if (lower.includes('select id from readings where user_id = $1 and reading_date = $2 and time_slot = $3')) {
    const excludeId = params[3] ? Number(params[3]) : null;
    const match = store.readings.find(
      (r) => r.user_id === Number(params[0]) &&
             r.reading_date === params[1] &&
             r.time_slot === params[2] &&
             (excludeId === null || r.id !== excludeId)
    );
    return { rows: match ? [{ id: match.id }] : [] };
  }

  if (lower.includes('insert into readings')) {
    const id = store.nextReadingId++;
    const newReading = {
      id,
      user_id: Number(params[0]),
      reading_date: params[1],
      time_slot: params[2],
      value_mgdl: Number(params[3]),
      created_at: new Date().toISOString(),
    };
    store.readings.push(newReading);
    return { rows: [{ ...newReading }] };
  }

  if (lower.includes('update readings set')) {
    const readingId = Number(params[3]);
    const userId = Number(params[4]);
    const idx = store.readings.findIndex((r) => r.id === readingId && r.user_id === userId);
    if (idx !== -1) {
      store.readings[idx] = {
        ...store.readings[idx],
        reading_date: params[0],
        time_slot: params[1],
        value_mgdl: Number(params[2]),
      };
      return { rows: [{ ...store.readings[idx] }] };
    }
    return { rows: [] };
  }

  if (lower.includes('delete from readings where id = $1 and user_id = $2')) {
    const id = Number(params[0]);
    const userId = Number(params[1]);
    const idx = store.readings.findIndex((r) => r.id === id && r.user_id === userId);
    if (idx !== -1) {
      store.readings.splice(idx, 1);
      return { rows: [{ id }] };
    }
    return { rows: [] };
  }

  if (lower.includes('select id, user_id from readings where id = $1')) {
    const match = store.readings.find((r) => r.id === Number(params[0]));
    return { rows: match ? [{ id: match.id, user_id: match.user_id }] : [] };
  }

  if (lower.includes('reading_date between $2 and $3')) {
    const userId = Number(params[0]);
    const from = params[1];
    const to = params[2];
    const rows = store.readings
      .filter((r) => r.user_id === userId && r.reading_date >= from && r.reading_date <= to)
      .sort((a, b) => a.reading_date.localeCompare(b.reading_date));
    return { rows };
  }

  if (lower.includes('user_id = $1 and reading_date = $2')) {
    const userId = Number(params[0]);
    const date = params[1];
    const rows = store.readings
      .filter((r) => r.user_id === userId && r.reading_date === date)
      .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
    return { rows };
  }

  if (lower.includes('select id, user_id, reading_date, time_slot, value_mgdl, created_at from readings where user_id = $1')) {
    const userId = Number(params[0]);
    let filtered = store.readings.filter((r) => r.user_id === userId);
    let pIdx = 1;
    if (params.length > 1 && typeof params[1] === 'string' && params[1].includes('-')) {
      filtered = filtered.filter((r) => r.reading_date === params[1]);
      pIdx++;
    }
    filtered.sort((a, b) => b.reading_date.localeCompare(a.reading_date));
    const limit = Number(params[pIdx]) || 20;
    const offset = Number(params[pIdx + 1]) || 0;
    return { rows: filtered.slice(offset, offset + limit) };
  }

  if (lower.includes('select count(*) from readings where user_id = $1')) {
    const userId = Number(params[0]);
    let filtered = store.readings.filter((r) => r.user_id === userId);
    if (params.length > 1 && typeof params[1] === 'string' && params[1].includes('-')) {
      filtered = filtered.filter((r) => r.reading_date === params[1]);
    }
    return { rows: [{ count: String(filtered.length) }] };
  }

  return { rows: [] };
};

const getClient = () => {
  const p = initPool();
  return p ? p.connect() : null;
};

module.exports = { query, getClient, pool };

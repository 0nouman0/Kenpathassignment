require('dotenv').config();
const { Pool, types } = require('pg');

// Force pg to return DATE columns (OID 1082) as exact YYYY-MM-DD strings
// rather than converting to local Date objects which suffer from timezone offsets
types.setTypeParser(1082, (str) => str);

const isTest = process.env.NODE_ENV === 'test';
const connectionString = isTest
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

/**
 * Execute a query against the pool.
 * @param {string} text  - SQL string
 * @param {any[]}  params - Parameterised values
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a dedicated client for transactions.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };

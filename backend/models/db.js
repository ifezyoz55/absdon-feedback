const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle DB client', err);
  process.exit(-1);
});

/**
 * Execute a parameterised query.
 * @param {string} text  - SQL query with $1, $2 placeholders
 * @param {Array}  params - Bound parameter values
 */
const query = (text, params) => pool.query(text, params);

/**
 * Acquire a client for manual transaction management.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };

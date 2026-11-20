const db = require('../db');

/**
 * Compute stats from an array of readings rows.
 */
const computeStats = (rows) => {
  if (rows.length === 0) {
    return { highest: null, lowest: null, average: null, count: 0 };
  }
  const values = rows.map((r) => r.value_mgdl);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const average = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  return { highest, lowest, average, count: rows.length };
};

/**
 * Format a Date as YYYY-MM-DD (local).
 */
const toDateStr = (d) => d.toISOString().slice(0, 10);

/**
 * GET /api/reports/daily?date=YYYY-MM-DD
 * Returns all readings for the given date + stats.
 */
const daily = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || toDateStr(new Date());

    const result = await db.query(
      `SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY time_slot ASC`,
      [userId, date]
    );

    const rows = result.rows;
    return res.json({
      dateRange: { from: date, to: date },
      stats: computeStats(rows),
      readings: rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/month-to-date?date=YYYY-MM-DD
 * Returns stats from 1st of the month of `date` through `date`.
 */
const monthToDate = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const date = req.query.date || toDateStr(new Date());

    const [year, month] = date.split('-');
    const from = `${year}-${month}-01`;
    const to = date;

    const result = await db.query(
      `SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date ASC, time_slot ASC`,
      [userId, from, to]
    );

    return res.json({
      dateRange: { from, to },
      stats: computeStats(result.rows),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reports/monthly?date=YYYY-MM-DD
 * Returns stats for the previous calendar month relative to `date`.
 */
const monthly = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let year, month;
    if (req.query.date && req.query.date.includes('-')) {
      const parts = req.query.date.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed current month
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    // Previous month calculation
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 12 : month; // 1-indexed

    const from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    // Last day of previous month
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await db.query(
      `SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date ASC, time_slot ASC`,
      [userId, from, to]
    );

    return res.json({
      dateRange: { from, to },
      stats: computeStats(result.rows),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { daily, monthToDate, monthly };

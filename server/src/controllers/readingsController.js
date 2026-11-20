const { validationResult } = require('express-validator');
const db = require('../db');

const MAX_READINGS_PER_DAY = 4;

/**
 * GET /api/readings?date=YYYY-MM-DD&page=1&limit=20
 */
const getReadings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) FROM readings WHERE user_id = $1';
    let dataQuery = `
      SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
      FROM readings
      WHERE user_id = $1
    `;
    const params = [userId];

    if (date) {
      params.push(date);
      countQuery += ` AND reading_date = $${params.length}`;
      dataQuery += ` AND reading_date = $${params.length}`;
    }

    dataQuery += ` ORDER BY reading_date DESC, time_slot ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const [countResult, dataResult] = await Promise.all([
      db.query(countQuery, params),
      db.query(dataQuery, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);

    return res.json({
      data: dataResult.rows,
      readings: dataResult.rows,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/readings
 */
const createReading = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.id;
    const { reading_date, time_slot, value_mgdl } = req.body;

    // Check daily limit (Kenpath spec: "You can add only 4 readings per day.")
    const countResult = await db.query(
      'SELECT COUNT(*) FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, reading_date]
    );
    if (parseInt(countResult.rows[0].count, 10) >= MAX_READINGS_PER_DAY) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }

    // Check unique slot per day (Kenpath spec: "You already have an After lunch reading for this date.")
    const dupCheck = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [userId, reading_date, time_slot]
    );
    if (dupCheck.rows.length > 0) {
      const slotDisplayNames = {
        morning_fasting: 'Morning (fasting)',
        after_breakfast: 'After breakfast',
        after_lunch: 'After lunch',
        after_dinner: 'After dinner',
      };
      const slotName = slotDisplayNames[time_slot] || time_slot;
      return res.status(409).json({ error: `You already have an ${slotName} reading for this date.` });
    }

    const result = await db.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value_mgdl)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, time_slot, value_mgdl, created_at`,
      [userId, reading_date, time_slot, value_mgdl]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/readings/:id
 */
const updateReading = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);
    const { reading_date, time_slot, value_mgdl } = req.body;

    // Confirm ownership
    const existing = await db.query(
      'SELECT id, user_id FROM readings WHERE id = $1',
      [readingId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found' });
    }
    if (existing.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You do not have permission to update this reading' });
    }

    // Check for duplicate slot conflict (excluding this record)
    const dupCheck = await db.query(
      `SELECT id FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4`,
      [userId, reading_date, time_slot, readingId]
    );
    if (dupCheck.rows.length > 0) {
      const slotDisplayNames = {
        morning_fasting: 'Morning (fasting)',
        after_breakfast: 'After breakfast',
        after_lunch: 'After lunch',
        after_dinner: 'After dinner',
      };
      const slotName = slotDisplayNames[time_slot] || time_slot;
      return res.status(409).json({ error: `You already have an ${slotName} reading for this date.` });
    }

    const result = await db.query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, value_mgdl = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, reading_date, time_slot, value_mgdl, created_at`,
      [reading_date, time_slot, value_mgdl, readingId, userId]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/readings/:id
 */
const deleteReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const readingId = parseInt(req.params.id, 10);

    const result = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [readingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found or access denied' });
    }

    return res.json({ message: 'Reading deleted successfully', id: readingId });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReadings, createReading, updateReading, deleteReading };

import { Router } from 'express'
import { isValidDate, monthToDateRange, previousMonthRange } from '../lib/dates.js'
import { summarize } from '../lib/stats.js'
import { READING_COLUMNS, SLOT_ORDER_SQL, toReading } from '../lib/rows.js'
import { requireAuth } from '../middleware/auth.js'

export function reportRoutes(pool) {
  const router = Router()
  router.use(requireAuth(pool))

  async function readingsBetween(userId, { from, to }) {
    const { rows } = await pool.query(
      `SELECT ${READING_COLUMNS} FROM readings
       WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3
       ORDER BY reading_date, ${SLOT_ORDER_SQL}`,
      [userId, from, to]
    )
    return rows.map(toReading)
  }

  const selectedDate = (req, res, next) => {
    if (!isValidDate(req.query.date)) {
      return res.status(400).json({ error: 'Please enter a valid date.', field: 'date' })
    }
    req.date = req.query.date
    next()
  }

  const report = (name, rangeFor, withReadings = false) => async (req, res, next) => {
    try {
      const range = rangeFor(req.date)
      const readings = await readingsBetween(req.user.id, range)
      res.json({
        report: name,
        range,
        stats: summarize(readings),
        ...(withReadings && { readings }),
      })
    } catch (err) {
      next(err)
    }
  }

  // Daily: just the selected date, plus the individual readings.
  router.get('/daily', selectedDate, report('daily', (d) => ({ from: d, to: d }), true))
  // Month-to-date: 1st of the selected month through the selected date.
  router.get('/month-to-date', selectedDate, report('month-to-date', monthToDateRange))
  // Monthly: the whole calendar month before the selected date's month.
  router.get('/monthly', selectedDate, report('monthly', previousMonthRange))

  return router
}

import { Router } from 'express'
import { validateReading, MAX_READINGS_PER_DAY, SLOT_LABELS } from '../lib/validation.js'
import { isValidDate } from '../lib/dates.js'
import { READING_COLUMNS, SLOT_ORDER_SQL, toReading } from '../lib/rows.js'
import { requireAuth } from '../middleware/auth.js'


const duplicateMessage = (slot) => {
  const label = SLOT_LABELS[slot]
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a'
  return `You already have ${article} ${label} reading for this date.`
}

/**
 * Checks the rules that need the database: one reading per slot per day, max 4 per day.
 * `excludeId` lets an edit ignore the reading being edited.
 */
async function checkDayRules(pool, userId, { reading_date, time_slot }, excludeId = null) {
  const { rows } = await pool.query(
    'SELECT id, time_slot FROM readings WHERE user_id = $1 AND reading_date = $2',
    [userId, reading_date]
  )
  const others = rows.filter((r) => r.id !== excludeId)
  if (others.some((r) => r.time_slot === time_slot)) {
    return { field: 'time_slot', message: duplicateMessage(time_slot) }
  }
  if (others.length >= MAX_READINGS_PER_DAY) {
    return { field: 'reading_date', message: 'You can add only 4 readings per day.' }
  }
  return null
}

function parseId(value) {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function readingRoutes(pool) {
  const router = Router()
  router.use(requireAuth(pool))

  const fail = (res, problem, status = 400) =>
    res.status(status).json({ error: problem.message, field: problem.field })

  // The unique constraint is the last line of defence if two requests race past the check above.
  const handledAsDuplicate = (err, res, slot) => {
    if (err.code !== '23505') return false
    fail(res, { field: 'time_slot', message: duplicateMessage(slot) }, 409)
    return true
  }

  // GET /api/readings?page=1&limit=20  [&date=YYYY-MM-DD | &from=...&to=...]
  router.get('/', async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1)
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20))

      const where = ['user_id = $1']
      const params = [req.user.id]
      const filters = [
        ['date', '='],
        ['from', '>='],
        ['to', '<='],
      ]
      for (const [name, op] of filters) {
        const value = req.query[name]
        if (value === undefined) continue
        if (!isValidDate(value)) {
          return fail(res, { message: 'Please enter a valid date.', field: name })
        }
        params.push(value)
        where.push(`reading_date ${op} $${params.length}`)
      }
      const whereSql = where.join(' AND ')

      const count = await pool.query(`SELECT COUNT(*) AS total FROM readings WHERE ${whereSql}`, params)
      const total = Number(count.rows[0].total)

      const { rows } = await pool.query(
        `SELECT ${READING_COLUMNS} FROM readings WHERE ${whereSql}
         ORDER BY reading_date DESC, ${SLOT_ORDER_SQL}
         LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
        params
      )
      res.json({
        data: rows.map(toReading),
        pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      })
    } catch (err) {
      next(err)
    }
  })

  router.post('/', async (req, res, next) => {
    const input = req.body ?? {}
    try {
      const problem =
        validateReading(input, req.user.timezone) || (await checkDayRules(pool, req.user.id, input))
      if (problem) return fail(res, problem)

      const { rows } = await pool.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, value_mgdl)
         VALUES ($1, $2, $3, $4) RETURNING ${READING_COLUMNS}`,
        [req.user.id, input.reading_date, input.time_slot, Number(input.value_mgdl)]
      )
      res.status(201).json({ reading: toReading(rows[0]) })
    } catch (err) {
      if (!handledAsDuplicate(err, res, input.time_slot)) next(err)
    }
  })

  router.put('/:id', async (req, res, next) => {
    const input = req.body ?? {}
    try {
      const id = parseId(req.params.id)
      const existing = id
        ? await pool.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [id, req.user.id])
        : { rows: [] }
      if (existing.rows.length === 0) return fail(res, { message: 'Reading not found.' }, 404)

      const problem =
        validateReading(input, req.user.timezone) ||
        (await checkDayRules(pool, req.user.id, input, id))
      if (problem) return fail(res, problem)

      const { rows } = await pool.query(
        `UPDATE readings SET reading_date = $1, time_slot = $2, value_mgdl = $3
         WHERE id = $4 AND user_id = $5 RETURNING ${READING_COLUMNS}`,
        [input.reading_date, input.time_slot, Number(input.value_mgdl), id, req.user.id]
      )
      res.json({ reading: toReading(rows[0]) })
    } catch (err) {
      if (!handledAsDuplicate(err, res, input.time_slot)) next(err)
    }
  })

  router.delete('/:id', async (req, res, next) => {
    try {
      const id = parseId(req.params.id)
      const result = id
        ? await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, req.user.id])
        : { rowCount: 0 }
      // 404 (not 403) for other people's readings, so ids cannot be probed.
      if (result.rowCount === 0) return fail(res, { message: 'Reading not found.' }, 404)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  })

  return router
}

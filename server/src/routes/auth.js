import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { validateRegistration } from '../lib/validation.js'
import { COOKIE_NAME, cookieOptions, signToken, requireAuth } from '../middleware/auth.js'

const publicUser = ({ id, name, email, timezone }) => ({ id, name, email, timezone })

function isValidTimezone(tz) {
  if (typeof tz !== 'string' || !tz) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function authRoutes(pool) {
  const router = Router()

  router.post('/register', async (req, res, next) => {
    try {
      const problem = validateRegistration(req.body ?? {})
      if (problem) return res.status(400).json({ error: problem.message, field: problem.field })

      const name = req.body.name.trim()
      const email = req.body.email.trim().toLowerCase()
      const timezone = isValidTimezone(req.body.timezone) ? req.body.timezone : 'UTC'
      const passwordHash = await bcrypt.hash(req.body.password, 10)

      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, timezone)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, timezone`,
        [name, email, passwordHash, timezone]
      )
      res.cookie(COOKIE_NAME, signToken(rows[0]), cookieOptions)
      res.status(201).json({ user: publicUser(rows[0]) })
    } catch (err) {
      if (err.code === '23505') {
        return res
          .status(409)
          .json({ error: 'An account with this email already exists.', field: 'email' })
      }
      next(err)
    }
  })

  router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body ?? {}
      if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        return res.status(400).json({ error: 'Please enter your email and password.' })
      }
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
        email.trim().toLowerCase(),
      ])
      const user = rows[0]
      // Same message for "no such user" and "wrong password" so emails cannot be probed.
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Incorrect email or password.' })
      }
      res.cookie(COOKIE_NAME, signToken(user), cookieOptions)
      res.json({ user: publicUser(user) })
    } catch (err) {
      next(err)
    }
  })

  router.post('/logout', (req, res) => {
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
    res.status(204).end()
  })

  router.get('/me', requireAuth(pool), (req, res) => {
    res.json({ user: publicUser(req.user) })
  })

  return router
}

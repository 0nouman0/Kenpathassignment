import jwt from 'jsonwebtoken'
import { config } from '../config.js'

export const COOKIE_NAME = 'sweety_token'

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction && process.env.COOKIE_SECURE !== 'false',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

/** Loads req.user from the auth cookie (or a Bearer token). Responds 401 otherwise. */
export function requireAuth(pool) {
  return async (req, res, next) => {
    const header = req.headers.authorization
    const token =
      req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null)
    if (!token) return res.status(401).json({ error: 'Please log in to continue.' })

    try {
      const { sub } = jwt.verify(token, config.jwtSecret)
      const { rows } = await pool.query(
        'SELECT id, name, email, timezone FROM users WHERE id = $1',
        [sub]
      )
      if (rows.length === 0) return res.status(401).json({ error: 'Please log in to continue.' })
      req.user = rows[0]
      next()
    } catch (err) {
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Your session has expired. Please log in again.' })
      }
      next(err)
    }
  }
}

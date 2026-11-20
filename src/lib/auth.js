import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './db'

const isProduction = process.env.NODE_ENV === 'production'
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

// In production runtime, require JWT_SECRET and fail fast if missing
if (isProduction && !isBuildPhase && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production mode.')
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  if (isProduction) {
    throw new Error('FATAL: JWT_SECRET environment variable must be set in production mode.')
  }
  return 'sweety_dev_jwt_secret_key_change_in_prod'
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const AUTH_COOKIE_NAME = 'sweety_token'

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'patient' },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret())
  } catch {
    return null
  }
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed)
}

/**
 * Extracts and verifies the user from the incoming Next.js Request (HTTP-only Cookie or Authorization header)
 */
export async function getAuthUser(req) {
  let token = null

  // 1. Primary: read HTTP-only cookie
  if (req.cookies && typeof req.cookies.get === 'function') {
    const cookieObj = req.cookies.get(AUTH_COOKIE_NAME)
    if (cookieObj?.value) token = cookieObj.value
  }

  // 2. Cookie header string parsing fallback
  if (!token) {
    const cookieHeader = req.headers?.get?.('cookie') || ''
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`))
    if (match) token = match[1]
  }

  // 3. Authorization header fallback: Bearer <token>
  if (!token) {
    const authHeader = req.headers?.get?.('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded || !decoded.id) return null

  // Verify user still exists in DB
  const userRes = await query('SELECT id, name, email, role, timezone FROM users WHERE id = $1', [decoded.id])
  if (userRes.rows.length === 0) return null

  return userRes.rows[0]
}

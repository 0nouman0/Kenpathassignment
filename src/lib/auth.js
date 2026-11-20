import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'sweety_super_secret_jwt_key_2026'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || 'patient' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
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
 * Extracts and verifies the user from the incoming Next.js Request (Authorization header or Cookie)
 */
export async function getAuthUser(req) {
  let token = null

  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }

  // 2. Cookie fallback
  if (!token) {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/sweety_token=([^;]+)/)
    if (match) token = match[1]
  }

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  // Verify user still exists in DB
  const userRes = await query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id])
  if (userRes.rows.length === 0) return null

  return userRes.rows[0]
}

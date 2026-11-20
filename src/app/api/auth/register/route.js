import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, password, timezone = 'UTC' } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 })
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail) || cleanEmail.length > 255) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }
    if (password.length > 128) {
      return NextResponse.json({ error: 'Password is too long.' }, { status: 400 })
    }

    // Rate limiting: 10 attempts per 15 min per IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const rateLimit = checkRateLimit(`register:${ip}`, 10, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const safeTimezone = typeof timezone === 'string' && timezone.length < 50 ? timezone : 'UTC'

    const result = await query(
      'INSERT INTO users (name, email, password_hash, timezone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, timezone, created_at',
      [name.trim(), cleanEmail, passwordHash, safeTimezone]
    )

    const user = result.rows[0]
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'patient',
      timezone: user.timezone || 'UTC',
    }
    const token = signToken(safeUser)

    const response = NextResponse.json({ user: safeUser }, { status: 201 })
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)

    return response
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

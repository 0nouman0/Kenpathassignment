import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { comparePassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // 10 attempts per 15 minutes per IP + email
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const rateLimit = checkRateLimit(`login:${ip}:${cleanEmail}`, 10, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please wait 15 minutes before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    const result = await query('SELECT id, name, email, password_hash, role, timezone FROM users WHERE email = $1', [cleanEmail])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const user = result.rows[0]
    const match = await comparePassword(password, user.password_hash)
    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'patient',
      timezone: user.timezone || 'UTC',
    }
    const token = signToken(safeUser)

    const response = NextResponse.json({ user: safeUser }, { status: 200 })
    response.cookies.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS)

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

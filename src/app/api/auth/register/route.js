import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [cleanEmail])
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
      [name.trim(), cleanEmail, passwordHash]
    )

    const user = result.rows[0]
    const token = signToken(user)

    const response = NextResponse.json({ token, user }, { status: 201 })
    response.cookies.set('sweety_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

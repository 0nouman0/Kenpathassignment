import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const result = await query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [cleanEmail])
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const user = result.rows[0]
    const match = await comparePassword(password, user.password_hash)
    if (!match) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role }
    const token = signToken(safeUser)

    const response = NextResponse.json({ token, user: safeUser }, { status: 200 })
    response.cookies.set('sweety_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

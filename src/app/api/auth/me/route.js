import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
    return NextResponse.json({ user })
  } catch (err) {
    console.error('Me error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

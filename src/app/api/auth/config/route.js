import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const demoMode = process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production'
  return NextResponse.json({ demoMode })
}

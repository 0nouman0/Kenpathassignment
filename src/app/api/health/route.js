import { NextResponse } from 'next/server'
import { getDbStatus } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const dbStatus = await getDbStatus()
  return NextResponse.json({
    status: 'ok',
    db: dbStatus, // 'postgres' | 'memory'
    demoMode: process.env.DEMO_MODE === 'true',
    timestamp: new Date().toISOString(),
  })
}

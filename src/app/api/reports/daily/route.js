import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function computeStats(rows) {
  if (!rows || rows.length === 0) {
    return { highest: null, lowest: null, average: null, count: 0 }
  }
  const values = rows.map((r) => Number(r.value_mgdl))
  const highest = Math.max(...values)
  const lowest = Math.min(...values)
  const average = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
  return { highest, lowest, average, count: rows.length }
}

/**
 * GET /api/reports/daily?date=YYYY-MM-DD
 */
export async function GET(req) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const result = await query(
      `SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date = $2
       ORDER BY time_slot ASC`,
      [user.id, date]
    )

    const rows = result.rows
    return NextResponse.json({
      dateRange: { from: date, to: date },
      stats: computeStats(rows),
      readings: rows,
    })
  } catch (err) {
    console.error('Daily report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

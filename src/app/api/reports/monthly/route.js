import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getPreviousMonthRange } from '@/lib/date'

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
 * GET /api/reports/monthly?date=YYYY-MM-DD
 * Returns stats for the previous full calendar month
 */
export async function GET(req) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10)

    const { from, to } = getPreviousMonthRange(dateStr)

    const result = await query(
      `SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
       FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date ASC, time_slot ASC`,
      [user.id, from, to]
    )

    return NextResponse.json({
      dateRange: { from, to },
      stats: computeStats(result.rows),
    })
  } catch (err) {
    console.error('Monthly report error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

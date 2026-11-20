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

    let year, month
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      year = parseInt(parts[0], 10)
      month = parseInt(parts[1], 10) - 1 // 0-indexed
    } else {
      const now = new Date()
      year = now.getFullYear()
      month = now.getMonth()
    }

    const prevYear = month === 0 ? year - 1 : year
    const prevMonth = month === 0 ? 12 : month // 1-indexed

    const from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

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

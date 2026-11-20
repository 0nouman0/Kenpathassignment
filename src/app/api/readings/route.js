import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { validateReadingInput, SLOT_DISPLAY_NAMES } from '@/lib/validations'

export const dynamic = 'force-dynamic'

const MAX_READINGS_PER_DAY = 4

/**
 * GET /api/readings?date=YYYY-MM-DD&page=1&limit=20
 */
export async function GET(req) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit'), 10) || 20))
    const offset = (page - 1) * limit

    let countQuery = 'SELECT COUNT(*) FROM readings WHERE user_id = $1'
    let dataQuery = `
      SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at
      FROM readings
      WHERE user_id = $1
    `
    const params = [user.id]

    if (date) {
      params.push(date)
      countQuery += ` AND reading_date = $${params.length}`
      dataQuery += ` AND reading_date = $${params.length}`
    }

    dataQuery += ` ORDER BY reading_date DESC, time_slot ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`

    const [countRes, dataRes] = await Promise.all([
      query(countQuery, params),
      query(dataQuery, [...params, limit, offset]),
    ])

    const total = parseInt(countRes.rows[0].count, 10)

    return NextResponse.json({
      data: dataRes.rows,
      readings: dataRes.rows,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (err) {
    console.error('GET /api/readings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/readings
 */
export async function POST(req) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = validateReadingInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { reading_date, time_slot, value_mgdl } = body

    // Check Rule: Maximum 4 readings per day
    const countRes = await query(
      'SELECT COUNT(*) FROM readings WHERE user_id = $1 AND reading_date = $2',
      [user.id, reading_date]
    )
    if (parseInt(countRes.rows[0].count, 10) >= MAX_READINGS_PER_DAY) {
      return NextResponse.json({ error: 'You can add only 4 readings per day.' }, { status: 400 })
    }

    // Check Rule: Only one reading per slot per day
    const dupCheck = await query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [user.id, reading_date, time_slot]
    )
    if (dupCheck.rows.length > 0) {
      const slotName = SLOT_DISPLAY_NAMES[time_slot] || time_slot
      return NextResponse.json(
        { error: `You already have an ${slotName} reading for this date.` },
        { status: 409 }
      )
    }

    const result = await query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value_mgdl)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, time_slot, value_mgdl, created_at`,
      [user.id, reading_date, time_slot, parseInt(value_mgdl, 10)]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err) {
    console.error('POST /api/readings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { validateReadingInput, SLOT_DISPLAY_NAMES } from '@/lib/validations'

export const dynamic = 'force-dynamic'

/**
 * GET /api/readings/:id
 */
export async function GET(req, { params }) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const readingId = parseInt(params.id, 10)
    const result = await query(
      'SELECT id, user_id, reading_date, time_slot, value_mgdl, created_at FROM readings WHERE id = $1 AND user_id = $2',
      [readingId, user.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('GET /api/readings/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/readings/:id
 */
export async function PUT(req, { params }) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const readingId = parseInt(params.id, 10)
    const body = await req.json()
    const validation = validateReadingInput(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { reading_date, time_slot, value_mgdl } = body

    // Ownership check: must return 404 for non-existent or other user's reading
    const existing = await query('SELECT id, user_id FROM readings WHERE id = $1 AND user_id = $2', [readingId, user.id])
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    // Check duplicate slot (excluding this record)
    const dupCheck = await query(
      `SELECT id FROM readings
       WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4`,
      [user.id, reading_date, time_slot, readingId]
    )
    if (dupCheck.rows.length > 0) {
      const slotName = SLOT_DISPLAY_NAMES[time_slot] || time_slot
      return NextResponse.json(
        { error: `You already have an ${slotName} reading for this date.` },
        { status: 409 }
      )
    }

    const result = await query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, value_mgdl = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, reading_date, time_slot, value_mgdl, created_at`,
      [reading_date, time_slot, parseInt(value_mgdl, 10), readingId, user.id]
    )

    return NextResponse.json(result.rows[0])
  } catch (err) {
    console.error('PUT /api/readings/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/readings/:id
 */
export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const readingId = parseInt(params.id, 10)
    const result = await query('DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id', [
      readingId,
      user.id,
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Reading not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Reading deleted successfully', id: readingId })
  } catch (err) {
    console.error('DELETE /api/readings/[id] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

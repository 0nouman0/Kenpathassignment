import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, signUp, isoDate } from './helpers.js'

let app
beforeEach(async () => {
  ;({ app } = await createTestApp())
})

const reading = (overrides = {}) => ({
  reading_date: isoDate(1),
  time_slot: 'morning',
  value_mgdl: 100,
  ...overrides,
})

describe('POST /api/readings validation', () => {
  it('creates a valid reading', async () => {
    const { agent } = await signUp(app)
    const res = await agent.post('/api/readings').send(reading())
    expect(res.status).toBe(201)
    expect(res.body.reading).toMatchObject({ time_slot: 'morning', value_mgdl: 100 })
  })

  it('requires a value', async () => {
    const { agent } = await signUp(app)
    const res = await agent.post('/api/readings').send(reading({ value_mgdl: undefined }))
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Please enter a glucose value.')
  })

  it.each([39, 601, 100.5, 'abc'])('rejects out-of-range or non-integer value %s', async (value) => {
    const { agent } = await signUp(app)
    const res = await agent.post('/api/readings').send(reading({ value_mgdl: value }))
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.')
  })

  it.each([40, 600])('accepts the boundary value %s', async (value) => {
    const { agent } = await signUp(app)
    const res = await agent.post('/api/readings').send(reading({ value_mgdl: value }))
    expect(res.status).toBe(201)
  })

  it('rejects a date in the future', async () => {
    const { agent } = await signUp(app)
    const res = await agent.post('/api/readings').send(reading({ reading_date: isoDate(-2) }))
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Date cannot be in the future.')
  })

  it('rejects a second reading for the same slot and date', async () => {
    const { agent } = await signUp(app)
    await agent.post('/api/readings').send(reading({ time_slot: 'after_lunch' }))
    const res = await agent.post('/api/readings').send(reading({ time_slot: 'after_lunch', value_mgdl: 130 }))
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('You already have an After lunch reading for this date.')
  })

  it('allows the same slot on a different day, and other slots on the same day', async () => {
    const { agent } = await signUp(app)
    expect((await agent.post('/api/readings').send(reading())).status).toBe(201)
    expect((await agent.post('/api/readings').send(reading({ reading_date: isoDate(2) }))).status).toBe(201)
    expect((await agent.post('/api/readings').send(reading({ time_slot: 'after_dinner' }))).status).toBe(201)
  })

  // With exactly 4 slots, a full day always contains every slot, so the duplicate-slot rule fires
  // first. The 4-per-day check is kept as a safety net should more slots ever be added.
  it('does not let a reading be moved onto a day that already has all 4 readings', async () => {
    const { agent } = await signUp(app)
    for (const slot of ['morning', 'after_breakfast', 'after_lunch', 'after_dinner']) {
      expect((await agent.post('/api/readings').send(reading({ time_slot: slot }))).status).toBe(201)
    }
    const other = await agent.post('/api/readings').send(reading({ reading_date: isoDate(3) }))
    const res = await agent.put(`/api/readings/${other.body.reading.id}`).send(reading())
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('You already have a Morning (fasting) reading for this date.')
  })
})

describe('reading ownership', () => {
  it("only lists the logged-in user's readings", async () => {
    const a = await signUp(app)
    const b = await signUp(app)
    await a.agent.post('/api/readings').send(reading())
    const res = await b.agent.get('/api/readings')
    expect(res.body.data).toHaveLength(0)
  })

  it("returns 404 when editing or deleting someone else's reading", async () => {
    const a = await signUp(app)
    const b = await signUp(app)
    const created = await a.agent.post('/api/readings').send(reading())
    const id = created.body.reading.id

    expect((await b.agent.put(`/api/readings/${id}`).send(reading({ value_mgdl: 200 }))).status).toBe(404)
    expect((await b.agent.delete(`/api/readings/${id}`)).status).toBe(404)
    expect((await a.agent.get('/api/readings')).body.data[0].value_mgdl).toBe(100)
  })
})

describe('update, delete and pagination', () => {
  it('lets a user change the value of their own reading without tripping the duplicate rule', async () => {
    const { agent } = await signUp(app)
    const created = await agent.post('/api/readings').send(reading())
    const res = await agent
      .put(`/api/readings/${created.body.reading.id}`)
      .send(reading({ value_mgdl: 111 }))
    expect(res.status).toBe(200)
    expect(res.body.reading.value_mgdl).toBe(111)
  })

  it('deletes a reading', async () => {
    const { agent } = await signUp(app)
    const created = await agent.post('/api/readings').send(reading())
    expect((await agent.delete(`/api/readings/${created.body.reading.id}`)).status).toBe(204)
    expect((await agent.get('/api/readings')).body.data).toHaveLength(0)
  })

  it('paginates, newest first', async () => {
    const { agent } = await signUp(app)
    for (let day = 1; day <= 5; day++) {
      await agent.post('/api/readings').send(reading({ reading_date: isoDate(day) }))
    }
    const res = await agent.get('/api/readings?page=2&limit=2')
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 })
    expect(res.body.data.map((r) => r.reading_date)).toEqual([isoDate(3), isoDate(4)])
  })
})

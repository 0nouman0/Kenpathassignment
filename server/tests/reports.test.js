import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, signUp } from './helpers.js'

let app, agent
beforeEach(async () => {
  ;({ app } = await createTestApp())
  ;({ agent } = await signUp(app))
})

// Readings are inserted straight through the API on past dates (the selected date is 15 Oct 2026).
async function add(date, slot, value) {
  const res = await agent.post('/api/readings').send({ reading_date: date, time_slot: slot, value_mgdl: value })
  expect(res.status).toBe(201)
}

describe('reports', () => {
  beforeEach(async () => {
    await add('2026-09-10', 'morning', 100) // previous month
    await add('2026-09-30', 'after_dinner', 160) // last day of previous month
    await add('2026-10-01', 'morning', 90) // first day of this month
    await add('2026-10-15', 'morning', 110) // selected date
    await add('2026-10-15', 'after_lunch', 141)
    await add('2026-10-20', 'morning', 300) // after the selected date: must not be counted
  })

  it('daily report covers only the selected date and lists the readings', async () => {
    const res = await agent.get('/api/reports/daily?date=2026-10-15')
    expect(res.body.range).toEqual({ from: '2026-10-15', to: '2026-10-15' })
    expect(res.body.stats).toEqual({ count: 2, highest: 141, lowest: 110, average: 125.5 })
    expect(res.body.readings.map((r) => r.time_slot)).toEqual(['morning', 'after_lunch'])
  })

  it('month-to-date runs from the 1st up to the selected date', async () => {
    const res = await agent.get('/api/reports/month-to-date?date=2026-10-15')
    expect(res.body.range).toEqual({ from: '2026-10-01', to: '2026-10-15' })
    expect(res.body.stats).toEqual({ count: 3, highest: 141, lowest: 90, average: 113.7 })
  })

  it('monthly report covers the whole previous month', async () => {
    const res = await agent.get('/api/reports/monthly?date=2026-10-15')
    expect(res.body.range).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(res.body.stats).toEqual({ count: 2, highest: 160, lowest: 100, average: 130 })
  })

  it('returns zero counts and null stats when there are no readings', async () => {
    const res = await agent.get('/api/reports/monthly?date=2026-02-15')
    expect(res.body.stats).toEqual({ count: 0, highest: null, lowest: null, average: null })
  })

  it('rejects a missing or invalid date', async () => {
    expect((await agent.get('/api/reports/daily')).status).toBe(400)
    expect((await agent.get('/api/reports/daily?date=2026-13-01')).status).toBe(400)
  })
})

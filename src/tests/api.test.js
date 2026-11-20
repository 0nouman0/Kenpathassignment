import { describe, it, expect, beforeAll } from 'vitest'
import { POST as createReading, GET as getReadings } from '../app/api/readings/route'
import { GET as getReadingById, PUT as updateReading, DELETE as deleteReading } from '../app/api/readings/[id]/route'
import { GET as getDailyReport } from '../app/api/reports/daily/route'
import { GET as getMonthToDateReport } from '../app/api/reports/month-to-date/route'
import { GET as getMonthlyReport } from '../app/api/reports/monthly/route'
import { signToken, AUTH_COOKIE_NAME } from '../lib/auth'
import { query } from '../lib/db'

function createAuthRequest(url, method = 'GET', body = null, token = null) {
  const headers = new Headers()
  if (body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Cookie', `${AUTH_COOKIE_NAME}=${token}`)
  }
  const init = { method, headers }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return new Request(url, init)
}

describe('API Route Integration Tests', () => {
  let user1Token
  let user2Token
  const testDate = '2026-05-15'

  beforeAll(async () => {
    // Ensure User 1 (Demo) has a token
    user1Token = signToken({ id: 1, email: 'demo@sweety.app', name: 'Mohammed (Demo Patient)' })

    // Create User 2 for cross-user isolation tests
    await query(
      'INSERT INTO users (name, email, password_hash, timezone) VALUES ($1, $2, $3, $4)',
      ['Second Patient', 'patient2@sweety.app', 'hash123', 'UTC']
    )
    user2Token = signToken({ id: 2, email: 'patient2@sweety.app', name: 'Second Patient' })
  })

  describe('401 Unauthorized Checks', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const req = createAuthRequest('http://localhost:3000/api/readings', 'GET')
      const res = await getReadings(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('The 5 Exact Non-Negotiable Validation Rules', () => {
    it('Rule 1: Rejects missing value with "Please enter a glucose value."', async () => {
      const req = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: testDate, time_slot: 'morning_fasting', value_mgdl: '' },
        user1Token
      )
      const res = await createReading(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Please enter a glucose value.')
    })

    it('Rule 2: Rejects out-of-range value (<40 or >600 or decimal) with "Value must be between 40 and 600 mg/dl."', async () => {
      // Below 40
      const reqLow = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: testDate, time_slot: 'morning_fasting', value_mgdl: 39 },
        user1Token
      )
      const resLow = await createReading(reqLow)
      expect(resLow.status).toBe(400)
      expect((await resLow.json()).error).toBe('Value must be between 40 and 600 mg/dl.')

      // Above 600
      const reqHigh = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: testDate, time_slot: 'morning_fasting', value_mgdl: 601 },
        user1Token
      )
      const resHigh = await createReading(reqHigh)
      expect(resHigh.status).toBe(400)
      expect((await resHigh.json()).error).toBe('Value must be between 40 and 600 mg/dl.')

      // Non-integer decimal
      const reqDec = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: testDate, time_slot: 'morning_fasting', value_mgdl: 120.5 },
        user1Token
      )
      const resDec = await createReading(reqDec)
      expect(resDec.status).toBe(400)
      expect((await resDec.json()).error).toBe('Value must be between 40 and 600 mg/dl.')
    })

    it('Rule 5: Rejects future dates with "Date cannot be in the future."', async () => {
      const req = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: '2099-12-31', time_slot: 'morning_fasting', value_mgdl: 110 },
        user1Token
      )
      const res = await createReading(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('Date cannot be in the future.')
    })

    it('Rule 3: Rejects duplicate reading for the same slot on the same day with exact message', async () => {
      const uniqueDate = '2026-04-10'
      // First insert: succeeds
      const req1 = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: uniqueDate, time_slot: 'after_lunch', value_mgdl: 130 },
        user1Token
      )
      const res1 = await createReading(req1)
      expect(res1.status).toBe(201)

      // Duplicate insert: fails
      const req2 = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: uniqueDate, time_slot: 'after_lunch', value_mgdl: 140 },
        user1Token
      )
      const res2 = await createReading(req2)
      expect(res2.status).toBe(409)
      const data2 = await res2.json()
      expect(data2.error).toBe('You already have an After lunch reading for this date.')
    })

    it('Rule 4: Rejects more than 4 readings in a single day with "You can add only 4 readings per day."', async () => {
      const maxDate = '2026-04-11'
      const slots = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner']

      // Add 4 readings
      for (const slot of slots) {
        const req = createAuthRequest(
          'http://localhost:3000/api/readings',
          'POST',
          { reading_date: maxDate, time_slot: slot, value_mgdl: 100 },
          user1Token
        )
        const res = await createReading(req)
        expect(res.status).toBe(201)
      }

      // Attempt 5th reading on same date
      const req5 = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: maxDate, time_slot: 'morning_fasting', value_mgdl: 105 },
        user1Token
      )
      const res5 = await createReading(req5)
      expect(res5.status).toBe(400)
      const data5 = await res5.json()
      expect(data5.error).toBe('You can add only 4 readings per day.')
    })
  })

  describe('Cross-User Data Isolation (Returns 404)', () => {
    let user2ReadingId

    beforeAll(async () => {
      const req = createAuthRequest(
        'http://localhost:3000/api/readings',
        'POST',
        { reading_date: '2026-04-12', time_slot: 'morning_fasting', value_mgdl: 95 },
        user2Token
      )
      const res = await createReading(req)
      const data = await res.json()
      user2ReadingId = data.id
    })

    it('returns 404 when User 1 tries to GET User 2 reading', async () => {
      const req = createAuthRequest(`http://localhost:3000/api/readings/${user2ReadingId}`, 'GET', null, user1Token)
      const res = await getReadingById(req, { params: { id: String(user2ReadingId) } })
      expect(res.status).toBe(404)
    })

    it('returns 404 when User 1 tries to PUT User 2 reading', async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/readings/${user2ReadingId}`,
        'PUT',
        { reading_date: '2026-04-12', time_slot: 'morning_fasting', value_mgdl: 115 },
        user1Token
      )
      const res = await updateReading(req, { params: { id: String(user2ReadingId) } })
      expect(res.status).toBe(404)
    })

    it('returns 404 when User 1 tries to DELETE User 2 reading', async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/readings/${user2ReadingId}`,
        'DELETE',
        null,
        user1Token
      )
      const res = await deleteReading(req, { params: { id: String(user2ReadingId) } })
      expect(res.status).toBe(404)
    })
  })

  describe('Pagination', () => {
    it('returns correct page, limit, total, and totalPages metadata', async () => {
      const req = createAuthRequest('http://localhost:3000/api/readings?page=1&limit=5', 'GET', null, user1Token)
      const res = await getReadings(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.total).toBeGreaterThan(0)
      expect(data.pagination.totalPages).toBeGreaterThan(0)
      expect(data.readings.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Report Calculations', () => {
    const reportDate = '2026-04-20'

    beforeAll(async () => {
      // Add known readings for reportDate: 80, 120, 160 -> avg 120.0, high 160, low 80, count 3
      const values = [
        { slot: 'morning_fasting', val: 80 },
        { slot: 'after_breakfast', val: 120 },
        { slot: 'after_lunch', val: 160 },
      ]
      for (const v of values) {
        const req = createAuthRequest(
          'http://localhost:3000/api/readings',
          'POST',
          { reading_date: reportDate, time_slot: v.slot, value_mgdl: v.val },
          user1Token
        )
        await createReading(req)
      }
    })

    it('calculates highest, lowest, average to 1 decimal, and count for daily report', async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/reports/daily?date=${reportDate}`,
        'GET',
        null,
        user1Token
      )
      const res = await getDailyReport(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.stats.count).toBe(3)
      expect(data.stats.highest).toBe(160)
      expect(data.stats.lowest).toBe(80)
      expect(data.stats.average).toBe(120.0)
      expect(data.readings.length).toBe(3)
    })

    it('returns empty state with null stats when no readings exist for date', async () => {
      const req = createAuthRequest(
        'http://localhost:3000/api/reports/daily?date=2021-01-01',
        'GET',
        null,
        user1Token
      )
      const res = await getDailyReport(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.stats).toEqual({ highest: null, lowest: null, average: null, count: 0 })
      expect(data.readings).toEqual([])
    })

    it('calculates month-to-date report range accurately', async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/reports/month-to-date?date=${reportDate}`,
        'GET',
        null,
        user1Token
      )
      const res = await getMonthToDateReport(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.dateRange).toEqual({ from: '2026-04-01', to: '2026-04-20' })
      expect(data.stats.count).toBeGreaterThanOrEqual(3)
    })

    it('calculates monthly report range accurately for previous full calendar month', async () => {
      const req = createAuthRequest(
        `http://localhost:3000/api/reports/monthly?date=${reportDate}`,
        'GET',
        null,
        user1Token
      )
      const res = await getMonthlyReport(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.dateRange).toEqual({ from: '2026-03-01', to: '2026-03-31' })
    })
  })
})

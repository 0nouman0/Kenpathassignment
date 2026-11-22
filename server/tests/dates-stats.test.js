import { describe, it, expect } from 'vitest'
import { isValidDate, monthToDateRange, previousMonthRange, isFuture, todayIn } from '../src/lib/dates.js'
import { summarize } from '../src/lib/stats.js'

describe('report date ranges', () => {
  it('month-to-date runs from the 1st to the selected date', () => {
    expect(monthToDateRange('2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' })
  })

  it('monthly is the whole previous month (example from the brief)', () => {
    expect(previousMonthRange('2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' })
  })

  it('monthly rolls back across a year boundary', () => {
    expect(previousMonthRange('2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' })
  })

  it('monthly handles leap-year February', () => {
    expect(previousMonthRange('2028-03-05')).toEqual({ from: '2028-02-01', to: '2028-02-29' })
    expect(previousMonthRange('2027-03-05')).toEqual({ from: '2027-02-01', to: '2027-02-28' })
  })
})

describe('date helpers', () => {
  it('rejects impossible dates', () => {
    expect(isValidDate('2026-02-30')).toBe(false)
    expect(isValidDate('15/10/2026')).toBe(false)
    expect(isValidDate('2026-10-15')).toBe(true)
  })

  it('uses the user timezone to decide what "today" is', () => {
    // 20:00 UTC on 1 Oct is already 2 Oct in Kolkata (UTC+5:30).
    const now = new Date('2026-10-01T20:00:00Z')
    expect(todayIn('UTC', now)).toBe('2026-10-01')
    expect(todayIn('Asia/Kolkata', now)).toBe('2026-10-02')
    expect(isFuture('2026-10-02', 'UTC', now)).toBe(true)
    expect(isFuture('2026-10-02', 'Asia/Kolkata', now)).toBe(false)
  })
})

describe('summarize', () => {
  it('returns highest, lowest, count and average rounded to 1 decimal', () => {
    const stats = summarize([{ value_mgdl: 90 }, { value_mgdl: 121 }, { value_mgdl: 150 }])
    expect(stats).toEqual({ count: 3, highest: 150, lowest: 90, average: 120.3 })
  })

  it('returns empty stats for no readings', () => {
    expect(summarize([])).toEqual({ count: 0, highest: null, lowest: null, average: null })
  })
})

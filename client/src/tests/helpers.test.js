import { describe, it, expect } from 'vitest'
import { formatLong, formatRange, todayLocal } from '../lib/dates'
import { classify, validateValue } from '../lib/glucose'
import { toDailyRows } from '../components/TrendChart'

describe('dates', () => {
  it('formats the example ranges from the brief', () => {
    expect(formatRange({ from: '2026-10-15', to: '2026-10-15' })).toBe('15 Oct 2026')
    expect(formatRange({ from: '2026-10-01', to: '2026-10-15' })).toBe('1 Oct – 15 Oct 2026')
    expect(formatRange({ from: '2026-09-01', to: '2026-09-30' })).toBe('1 Sep – 30 Sep 2026')
  })

  it('writes long dates with a weekday', () => {
    expect(formatLong('2026-11-22')).toBe('Sunday, 22 November 2026')
  })

  it('uses the local calendar date, not UTC', () => {
    // 23:30 local time on 31 Dec is still 31 Dec, whatever the UTC date is.
    expect(todayLocal(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31')
  })
})

describe('glucose helpers', () => {
  it('validates whole numbers from 40 to 600', () => {
    expect(validateValue('')).toBe('Please enter a glucose value.')
    expect(validateValue('39')).toMatch(/between 40 and 600/)
    expect(validateValue('600')).toBe('')
    expect(validateValue('40')).toBe('')
    expect(validateValue('99.5')).toMatch(/between 40 and 600/)
  })

  it('uses a tighter upper bound for fasting readings', () => {
    expect(classify(140, 'morning').key).toBe('high')
    expect(classify(140, 'after_lunch').key).toBe('ok')
    expect(classify(65, 'after_lunch').key).toBe('low')
  })
})

describe('chart data', () => {
  it('groups readings by day with a rounded average', () => {
    const rows = toDailyRows([
      { reading_date: '2026-10-02', time_slot: 'morning', value_mgdl: 100 },
      { reading_date: '2026-10-01', time_slot: 'morning', value_mgdl: 90 },
      { reading_date: '2026-10-01', time_slot: 'after_lunch', value_mgdl: 131 },
    ])
    expect(rows.map((r) => r.date)).toEqual(['2026-10-01', '2026-10-02'])
    expect(rows[0]).toMatchObject({ morning: 90, after_lunch: 131, average: 111 })
  })
})

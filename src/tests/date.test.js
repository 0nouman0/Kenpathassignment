import { describe, it, expect } from 'vitest'
import {
  isValidDateFormat,
  isLeapYear,
  getTodayInTimezone,
  isDateInFuture,
  getMonthToDateRange,
  getPreviousMonthRange,
  formatDateReadable,
} from '../lib/date'

describe('Date and Timezone Utility Tests', () => {
  describe('isValidDateFormat', () => {
    it('validates correct calendar dates', () => {
      expect(isValidDateFormat('2026-10-15')).toBe(true)
      expect(isValidDateFormat('2024-02-29')).toBe(true) // Leap year
    })

    it('rejects invalid formats and impossible dates', () => {
      expect(isValidDateFormat('2023-02-29')).toBe(false) // Non-leap year
      expect(isValidDateFormat('2026-13-01')).toBe(false) // Invalid month
      expect(isValidDateFormat('2026-04-31')).toBe(false) // April has 30 days
      expect(isValidDateFormat('invalid-date')).toBe(false)
      expect(isValidDateFormat('')).toBe(false)
    })
  })

  describe('isLeapYear', () => {
    it('correctly identifies leap years', () => {
      expect(isLeapYear(2024)).toBe(true)
      expect(isLeapYear(2000)).toBe(true)
      expect(isLeapYear(2023)).toBe(false)
      expect(isLeapYear(1900)).toBe(false)
    })
  })

  describe('getPreviousMonthRange (Monthly Report calculation)', () => {
    it('handles regular mid-year month boundaries (Oct -> Sep)', () => {
      const range = getPreviousMonthRange('2026-10-15')
      expect(range).toEqual({
        from: '2026-09-01',
        to: '2026-09-30',
      })
    })

    it('handles December to January year rollover', () => {
      const range = getPreviousMonthRange('2026-01-10')
      expect(range).toEqual({
        from: '2025-12-01',
        to: '2025-12-31',
      })
    })

    it('handles February in a leap year (2024)', () => {
      const range = getPreviousMonthRange('2024-03-15')
      expect(range).toEqual({
        from: '2024-02-01',
        to: '2024-02-29',
      })
    })

    it('handles February in a non-leap year (2023)', () => {
      const range = getPreviousMonthRange('2023-03-15')
      expect(range).toEqual({
        from: '2023-02-01',
        to: '2023-02-28',
      })
    })
  })

  describe('getMonthToDateRange', () => {
    it('calculates 1st of month to selected date', () => {
      const range = getMonthToDateRange('2026-10-15')
      expect(range).toEqual({
        from: '2026-10-01',
        to: '2026-10-15',
      })
    })

    it('handles 1st day of month', () => {
      const range = getMonthToDateRange('2026-05-01')
      expect(range).toEqual({
        from: '2026-05-01',
        to: '2026-05-01',
      })
    })
  })

  describe('Timezone-aware date calculations', () => {
    it('returns a valid YYYY-MM-DD date for any IANA timezone', () => {
      const tokyo = getTodayInTimezone('Asia/Tokyo')
      const london = getTodayInTimezone('Europe/London')
      const newYork = getTodayInTimezone('America/New_York')

      expect(isValidDateFormat(tokyo)).toBe(true)
      expect(isValidDateFormat(london)).toBe(true)
      expect(isValidDateFormat(newYork)).toBe(true)
    })

    it('falls back gracefully to UTC on invalid timezone string', () => {
      const fallback = getTodayInTimezone('Invalid/Unknown_TZ')
      expect(isValidDateFormat(fallback)).toBe(true)
    })

    it('detects future dates correctly', () => {
      expect(isDateInFuture('2099-01-01', 'UTC')).toBe(true)
      expect(isDateInFuture('2000-01-01', 'UTC')).toBe(false)
    })
  })

  describe('formatDateReadable', () => {
    it('formats date to English standard format', () => {
      expect(formatDateReadable('2026-10-15')).toBe('15 Oct 2026')
      expect(formatDateReadable('2026-01-01')).toBe('1 Jan 2026')
    })
  })
})

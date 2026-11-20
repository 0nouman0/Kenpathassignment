/**
 * Date and timezone helper utilities for Sweety
 */

/**
 * Validates whether a string matches YYYY-MM-DD and represents a valid calendar day
 */
export function isValidDateFormat(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return false
  }
  const [year, month, day] = str.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

/**
 * Returns whether a given year is a leap year
 */
export function isLeapYear(year) {
  const y = Number(year)
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/**
 * Gets "today" formatted as YYYY-MM-DD in the specified IANA timezone
 */
export function getTodayInTimezone(timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date())
  } catch {
    // Fallback to UTC if timezone is invalid
    return new Date().toISOString().slice(0, 10)
  }
}

/**
 * Determines whether the given date string is in the future relative to the user's timezone
 */
export function isDateInFuture(dateStr, timezone = 'UTC') {
  const todayStr = getTodayInTimezone(timezone)
  return dateStr > todayStr
}

/**
 * Calculates month-to-date range: 1st of the month through the anchor date
 * e.g. '2026-10-15' -> { from: '2026-10-01', to: '2026-10-15' }
 */
export function getMonthToDateRange(anchorDateStr) {
  const dateStr = anchorDateStr || new Date().toISOString().slice(0, 10)
  const [year, month] = dateStr.split('-')
  return {
    from: `${year}-${month}-01`,
    to: dateStr,
  }
}

/**
 * Calculates full previous calendar month range relative to the anchor date
 * Correctly handles:
 * - December to January year rollover (e.g. 2026-01-15 -> 2025-12-01 to 2025-12-31)
 * - Leap years (e.g. 2024-03-10 -> 2024-02-01 to 2024-02-29)
 * - Non-leap years (e.g. 2023-03-10 -> 2023-02-01 to 2023-02-28)
 */
export function getPreviousMonthRange(anchorDateStr) {
  const dateStr = anchorDateStr || new Date().toISOString().slice(0, 10)
  const parts = dateStr.split('-').map(Number)
  const year = parts[0]
  const month = parts[1] // 1-indexed

  let prevYear = year
  let prevMonth = month - 1
  if (prevMonth === 0) {
    prevMonth = 12
    prevYear = year - 1
  }

  // Days in previous month
  // Date(prevYear, prevMonth, 0) gives last day of prevMonth (when prevMonth is 1-indexed in JS constructor)
  const lastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate()

  const mm = String(prevMonth).padStart(2, '0')
  const dd = String(lastDay).padStart(2, '0')

  return {
    from: `${prevYear}-${mm}-01`,
    to: `${prevYear}-${mm}-${dd}`,
  }
}

/**
 * Formats YYYY-MM-DD into readable English date, e.g. "15 Oct 2026"
 */
export function formatDateReadable(dateStr) {
  if (!dateStr || !isValidDateFormat(dateStr)) return dateStr
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${day} ${months[month - 1]} ${year}`
}

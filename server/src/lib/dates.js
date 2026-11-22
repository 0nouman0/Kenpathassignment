// All dates in the API are plain "YYYY-MM-DD" strings. We never build them from
// a JS Date in the server's timezone, which avoids off-by-one-day bugs.

export function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false
  const [y, m, d] = str.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/** Today's date as YYYY-MM-DD in the given IANA timezone. */
export function todayIn(timezone = 'UTC', now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

export function isFuture(dateStr, timezone = 'UTC', now = new Date()) {
  return dateStr > todayIn(timezone, now)
}

const pad = (n) => String(n).padStart(2, '0')
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate()

/** 1st of the month up to and including the selected date. */
export function monthToDateRange(dateStr) {
  const [y, m] = dateStr.split('-').map(Number)
  return { from: `${y}-${pad(m)}-01`, to: dateStr }
}

/** The whole calendar month before the selected date's month. */
export function previousMonthRange(dateStr) {
  let [y, m] = dateStr.split('-').map(Number)
  m -= 1
  if (m === 0) {
    m = 12
    y -= 1
  }
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(daysInMonth(y, m))}` }
}

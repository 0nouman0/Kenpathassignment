// Dates are plain "YYYY-MM-DD" strings everywhere. These helpers use the browser's local
// calendar, never toISOString(), which would be a day off for people east or west of UTC.

const pad = (n) => String(n).padStart(2, '0')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function todayLocal(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Fixed names (not toLocaleDateString) so the output is identical in every browser and locale.
function parts(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m: m - 1, d, weekday: new Date(y, m - 1, d).getDay() }
}

/** "Sunday, 22 November 2026" */
export function formatLong(dateStr) {
  const { y, m, d, weekday } = parts(dateStr)
  return `${WEEKDAYS[weekday]}, ${d} ${MONTHS_LONG[m]} ${y}`
}

/** "15 Oct 2026" */
export function formatDate(dateStr) {
  const { y, m, d } = parts(dateStr)
  return `${d} ${MONTHS[m]} ${y}`
}

/** "15 Oct" */
export function formatDayMonth(dateStr) {
  const { m, d } = parts(dateStr)
  return `${d} ${MONTHS[m]}`
}

/** "1 Oct – 15 Oct 2026", or just "15 Oct 2026" when the range is a single day. */
export function formatRange({ from, to }) {
  if (from === to) return formatDate(from)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${sameYear ? formatDayMonth(from) : formatDate(from)} – ${formatDate(to)}`
}

export function monthStart(dateStr) {
  return `${dateStr.slice(0, 7)}-01`
}

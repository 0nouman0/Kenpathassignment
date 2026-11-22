export const SLOTS = [
  { value: 'morning', label: 'Morning (fasting)', hint: 'Before breakfast' },
  { value: 'after_breakfast', label: 'After breakfast', hint: '1–2 hours after eating' },
  { value: 'after_lunch', label: 'After lunch', hint: '1–2 hours after eating' },
  { value: 'after_dinner', label: 'After dinner', hint: '1–2 hours after eating' },
]

export const slotLabel = (value) => SLOTS.find((s) => s.value === value)?.label ?? value

export const VALUE_MIN = 40
export const VALUE_MAX = 600

/**
 * Rough band for a reading, using commonly quoted adult targets:
 * fasting 70–130 mg/dl, after a meal under 180 mg/dl. For orientation only.
 */
export function classify(value, slot) {
  const upper = slot === 'morning' ? 130 : 180
  if (value < 70) return { key: 'low', label: 'Low' }
  if (value > upper) return { key: 'high', label: 'High' }
  return { key: 'ok', label: 'In range' }
}

/** Same rules as the server, so people get feedback before the request is sent. */
export function validateValue(raw) {
  if (raw === '' || raw === null || raw === undefined) return 'Please enter a glucose value.'
  const n = Number(raw)
  if (!Number.isInteger(n) || n < VALUE_MIN || n > VALUE_MAX) {
    return 'Value must be between 40 and 600 mg/dl.'
  }
  return ''
}

export function formatAverage(value) {
  return value === null || value === undefined ? '–' : Number(value).toFixed(1)
}

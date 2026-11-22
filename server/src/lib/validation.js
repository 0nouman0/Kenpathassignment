import { isValidDate, isFuture } from './dates.js'

export const TIME_SLOTS = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner']

export const SLOT_LABELS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
}

export const MAX_READINGS_PER_DAY = 4

/**
 * Checks the parts of a reading that do not need the database.
 * Returns { field, message } for the first problem, or null if the input is fine.
 */
export function validateReading({ reading_date, time_slot, value_mgdl }, timezone = 'UTC') {
  if (value_mgdl === undefined || value_mgdl === null || value_mgdl === '') {
    return { field: 'value_mgdl', message: 'Please enter a glucose value.' }
  }
  const value = Number(value_mgdl)
  if (!Number.isInteger(value) || value < 40 || value > 600) {
    return { field: 'value_mgdl', message: 'Value must be between 40 and 600 mg/dl.' }
  }
  if (!TIME_SLOTS.includes(time_slot)) {
    return { field: 'time_slot', message: 'Please choose a time slot.' }
  }
  if (!isValidDate(reading_date)) {
    return { field: 'reading_date', message: 'Please enter a valid date.' }
  }
  if (isFuture(reading_date, timezone)) {
    return { field: 'reading_date', message: 'Date cannot be in the future.' }
  }
  return null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateRegistration({ name, email, password }) {
  if (typeof name !== 'string' || !name.trim()) {
    return { field: 'name', message: 'Please enter your name.' }
  }
  if (name.trim().length > 100) {
    return { field: 'name', message: 'Name must be 100 characters or fewer.' }
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return { field: 'email', message: 'Please enter a valid email address.' }
  }
  if (typeof password !== 'string' || password.length < 8) {
    return { field: 'password', message: 'Password must be at least 8 characters.' }
  }
  return null
}

import { isDateInFuture } from './date'

/**
 * Strict validation rules matching Kenpath assignment requirements
 */

export const TIME_SLOTS = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
]

export const SLOT_DISPLAY_NAMES = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
}

export function validateReadingInput({ reading_date, time_slot, value_mgdl }, userTimezone = 'UTC') {
  // Rule 1: Value is required
  if (value_mgdl === undefined || value_mgdl === null || value_mgdl === '') {
    return { valid: false, error: 'Please enter a glucose value.', field: 'value_mgdl' }
  }

  // Rule 2: Value must be a whole number between 40 and 600
  const val = Number(value_mgdl)
  if (isNaN(val) || !Number.isInteger(val) || val < 40 || val > 600) {
    return { valid: false, error: 'Value must be between 40 and 600 mg/dl.', field: 'value_mgdl' }
  }

  // Rule 3: Date cannot be in the future
  if (!reading_date) {
    return { valid: false, error: 'Please select a date.', field: 'reading_date' }
  }

  if (isDateInFuture(reading_date, userTimezone)) {
    return { valid: false, error: 'Date cannot be in the future.', field: 'reading_date' }
  }

  // Rule 4: Valid time slot
  if (!time_slot || !TIME_SLOTS.includes(time_slot)) {
    return {
      valid: false,
      error: `Time slot must be one of: ${TIME_SLOTS.join(', ')}`,
      field: 'time_slot',
    }
  }

  return { valid: true }
}

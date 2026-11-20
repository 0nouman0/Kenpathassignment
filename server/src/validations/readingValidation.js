const { body } = require('express-validator');

const TIME_SLOTS = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

/**
 * Shared validation rules for creating / updating a reading.
 * Matches Kenpath specification error messages.
 */
const readingValidation = [
  body('reading_date')
    .notEmpty().withMessage('Please select a date.')
    .custom((value) => {
      // Robust ISO date comparison YYYY-MM-DD
      const todayStr = new Date().toISOString().slice(0, 10);
      if (value > todayStr) {
        throw new Error('Date cannot be in the future.');
      }
      return true;
    }),

  body('time_slot')
    .notEmpty().withMessage('Please select a time slot.')
    .isIn(TIME_SLOTS)
    .withMessage(`time_slot must be one of: ${TIME_SLOTS.join(', ')}`),

  body('value_mgdl')
    .notEmpty().withMessage('Please enter a glucose value.')
    .custom((val) => {
      const num = Number(val);
      if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
        throw new Error('Value must be between 40 and 600 mg/dl.');
      }
      return true;
    }),
];

module.exports = { readingValidation, TIME_SLOTS };

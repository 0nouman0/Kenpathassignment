const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { readingValidation } = require('../validations/readingValidation');
const {
  getReadings,
  createReading,
  updateReading,
  deleteReading,
} = require('../controllers/readingsController');

router.use(authenticate);

router.get('/', getReadings);
router.post('/', readingValidation, createReading);
router.put('/:id', readingValidation, updateReading);
router.delete('/:id', deleteReading);

module.exports = router;

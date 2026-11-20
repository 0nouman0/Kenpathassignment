const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { daily, monthToDate, monthly } = require('../controllers/reportsController');

router.use(authenticate);

router.get('/daily', daily);
router.get('/month-to-date', monthToDate);
router.get('/monthly', monthly);

module.exports = router;

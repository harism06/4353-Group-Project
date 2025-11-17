
const express = require('express');
const router = express.Router();
const { createHistoryRecord, getHistoryByUserId } = require('../controllers/historyController');

// Volunteer history routes

router.post('/', createHistoryRecord);
router.get('/:userId', getHistoryByUserId);

module.exports = router;

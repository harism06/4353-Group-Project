
const express = require('express');
const router = express.Router();
const { createHistoryRecord, getHistoryByUserId, deleteHistoryRecord } = require('../controllers/historyController');

// Volunteer history routes

router.post('/', createHistoryRecord);
router.get('/:userId', getHistoryByUserId);
router.delete('/', deleteHistoryRecord);

module.exports = router;

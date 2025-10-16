
const express = require('express');
const router = express.Router();
const { createHistoryRecord, getHistoryByUserId } = require('../controllers/historyController');

/**
 * @file Volunteer history routes.
 * @module backend/routes/history
 */

/**
 * POST /api/history
 * Route to create a new history record.
 * @function
 * @param {Object} req - Express request object. Expected to contain history data in `req.body`.
 * @param {Object} res - Express response object.
 */
router.post('/', createHistoryRecord);

/**
 * GET /api/history/:userId
 * Route to retrieve a user's history records.
 * @function
 * @param {Object} req - Express request object. Expected to contain `userId` in `req.params`.
 * @param {Object} res - Express response object.
 */
router.get('/:userId', getHistoryByUserId);

module.exports = router;

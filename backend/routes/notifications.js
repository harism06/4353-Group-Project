
const express = require('express');
const router = express.Router();
const { createNotification } = require('../controllers/notificationController');

/**
 * @file Notification routes.
 * @module backend/routes/notifications
 */

/**
 * POST /api/notifications
 * Route to create a new notification.
 * @function
 * @param {Object} req - Express request object. Expected to contain notification data in `req.body`.
 * @param {Object} res - Express response object.
 */
router.post('/', createNotification);

module.exports = router;

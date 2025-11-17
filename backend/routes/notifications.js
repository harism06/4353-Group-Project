
const express = require('express');
const router = express.Router();
const { createNotification } = require('../controllers/notificationController');

// Notification routes
router.post('/', createNotification);

module.exports = router;

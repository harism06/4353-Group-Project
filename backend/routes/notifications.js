const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  markAllAsRead,
} = require("../controllers/notificationController");
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

router.post("/", createNotification);

router.get("/", getNotifications);

router.post("/mark-all-read", markAllAsRead);

module.exports = router;

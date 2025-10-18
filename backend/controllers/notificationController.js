const { randomUUID } = require("crypto");
const notifications = require("../data/notifications");
const {
  createNotificationInputSchema,
} = require("../validations/notificationSchema");

/**
 * @file Notification controller functions.
 * @module backend/controllers/notificationController
 */

exports.createNotification = (req, res) => {
  try {
    const validatedInput = createNotificationInputSchema.parse(req.body);

    const newNotification = {
      id: randomUUID(),
      userId: validatedInput.userId,
      eventId: validatedInput.eventId,
      message: validatedInput.message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    console.log("✅ New notification:", newNotification);

    notifications.push(newNotification);
    return res.status(201).json({ success: true, data: newNotification });
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Failed to create notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getNotifications = (req, res) => {
  try {
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

exports.markAllAsRead = (req, res) => {
  try {
    notifications.forEach((n) => (n.read = true));
    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to mark notifications as read" });
  }
};

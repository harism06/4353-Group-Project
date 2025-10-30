const { randomUUID } = require("crypto");
const notifications = require("../data/notifications");
const {
  createNotificationInputSchema,
} = require("../validations/notificationSchema");

/**
 * @file Notification controller functions.
 * @module backend/controllers/notificationController
 */

/**
 * Handles POST request to create a new notification.
 * Validates the request body against `createNotificationInputSchema`.
 * If valid, generates a UUID for the notification, adds a timestamp, saves it to mock data,
 * and returns the new notification with a 201 status.
 * If validation fails, returns a 400 status with validation errors.
 * @function
 * @param {Object} req - Express request object. Expected to contain notification data in `req.body`.
 * @param {Object} res - Express response object.
 */
exports.createNotification = (req, res) => {
  try {
    // Validate the incoming request body
    const validatedInput = createNotificationInputSchema.parse(req.body);

    const newNotification = {
      id: randomUUID(),
      userId: validatedInput.userId,
      eventId: validatedInput.eventId,
      message: validatedInput.message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    notifications.push(newNotification);
    // Optional: write to DB notifications table if later added
    // Reuse VolunteerHistory as a trigger for 'assigned' notification example
    if (String(validatedInput.message).toLowerCase().includes('assigned')) {
      // no-op; placeholder for future assignment hooks
    }
    return res.status(201).json(newNotification);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

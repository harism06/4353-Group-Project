
const { z } = require('zod');

/**
 * @file Zod validation schema for notifications.
 * @module backend/validations/notificationSchema
 */

/**
 * Zod schema for validating notification creation input from request body.
 * Defines the structure and types for incoming notification data.
 */
const createNotificationInputSchema = z.object({
  userId: z.string().uuid({ message: "Invalid UUID format for user ID." }),
  eventId: z.string().uuid({ message: "Invalid UUID format for event ID." }).optional(),
  message: z.string().min(1, "Notification message cannot be empty.").max(500, "Notification message cannot exceed 500 characters."),
});

module.exports = { createNotificationInputSchema };

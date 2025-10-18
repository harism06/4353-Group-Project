const { z } = require("zod");

/**
 * @file Zod validation schema for notifications.
 * @module backend/validations/notificationSchema
 */

const coerceId = (fieldName) =>
  z.preprocess(
    (val) => (typeof val === "number" ? val.toString() : val),
    z.string().min(1, { message: `${fieldName} is required.` })
  );

/**
 * Zod schema for validating notification creation input from request body.
 * Defines the structure and types for incoming notification data.
 */
const createNotificationInputSchema = z.object({
  userId: coerceId("User ID"),
  eventId: coerceId("Event ID").optional(),
  message: z
    .string()
    .min(1, "Notification message cannot be empty.")
    .max(500, "Notification message cannot exceed 500 characters."),
});

module.exports = { createNotificationInputSchema };

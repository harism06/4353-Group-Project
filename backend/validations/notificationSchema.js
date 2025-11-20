
const { z } = require('zod');

// Zod validation schema for notifications
const createNotificationInputSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  eventId: z.string().min(1, "Event ID is required.").optional(),
  message: z.string().min(1, "Notification message cannot be empty.").max(500, "Notification message cannot exceed 500 characters."),
});

module.exports = { createNotificationInputSchema };

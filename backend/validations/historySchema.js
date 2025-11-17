
const { z } = require('zod');

// Zod validation schema for volunteer history records
const createHistoryInputSchema = z.object({
  userId: z.string().uuid({ message: "Invalid UUID format for user ID." }),
  eventId: z.string().uuid({ message: "Invalid UUID format for event ID." }),
  activityType: z.string().min(1, "Activity type cannot be empty.").max(100, "Activity type cannot exceed 100 characters."),
  details: z.string().optional(),
});

const getHistoryByUserIdSchema = z.object({
  userId: z.string().uuid({ message: "Invalid UUID format for user ID." }),
});

module.exports = { createHistoryInputSchema, getHistoryByUserIdSchema };

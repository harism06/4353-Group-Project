
const { z } = require('zod');

// Zod validation schema for volunteer history records
const createHistoryInputSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  eventId: z.string().min(1, "Event ID is required."),
  activityType: z.string().min(1, "Activity type cannot be empty.").max(100, "Activity type cannot exceed 100 characters."),
  details: z.string().optional(),
});

const getHistoryByUserIdSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
});

module.exports = { createHistoryInputSchema, getHistoryByUserIdSchema };

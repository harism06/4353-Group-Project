
const { z } = require('zod');

/**
 * @file Zod validation schema for volunteer history records.
 * @module backend/validations/historySchema
 */

/**
 * Zod schema for validating volunteer history record creation input from request body.
 * Defines the structure and types for incoming history data.
 */
const createHistoryInputSchema = z.object({
  userId: z.string().uuid({ message: "Invalid UUID format for user ID." }),
  eventId: z.string().uuid({ message: "Invalid UUID format for event ID." }),
  activityType: z.string().min(1, "Activity type cannot be empty.").max(100, "Activity type cannot exceed 100 characters."),
  details: z.string().optional(),
});

/**
 * Zod schema for validating the user ID parameter when fetching history.
 */
const getHistoryByUserIdSchema = z.object({
  userId: z.string().uuid({ message: "Invalid UUID format for user ID." }),
});

module.exports = { createHistoryInputSchema, getHistoryByUserIdSchema };

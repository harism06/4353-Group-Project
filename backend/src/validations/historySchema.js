const { z } = require("zod");

/**
 * @file Zod validation schema for volunteer history records.
 * @module backend/validations/historySchema
 */

const coerceId = (fieldName) =>
  z.preprocess(
    (val) => (typeof val === "number" ? val.toString() : val),
    z.string().min(1, { message: `${fieldName} is required.` })
  );

/**
 * Zod schema for validating volunteer history record creation input from request body.
 * Defines the structure and types for incoming history data.
 */
const createHistoryInputSchema = z.object({
  userId: coerceId("User ID"),
  eventId: coerceId("Event ID"),
  activityType: z
    .string()
    .min(1, "Activity type cannot be empty.")
    .max(100, "Activity type cannot exceed 100 characters."),
  details: z.string().optional(),
});

/**
 * Zod schema for validating the user ID parameter when fetching history.
 */
const getHistoryByUserIdSchema = z.object({
  userId: coerceId("User ID"),
});

module.exports = { createHistoryInputSchema, getHistoryByUserIdSchema };

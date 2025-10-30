const { randomUUID } = require("crypto");
const history = require("../data/history");
// Prisma is optional at runtime; dynamically load when available
const {
  createHistoryInputSchema,
  getHistoryByUserIdSchema,
} = require("../validations/historySchema");

/**
 * @file Volunteer history controller functions.
 * @module backend/controllers/historyController
 */

/**
 * Handles POST request to create a new history record.
 * Validates the request body against `createHistoryInputSchema`.
 * If valid, generates a UUID for the record, adds a timestamp, saves it to mock data,
 * and returns the new record with a 201 status.
 * If validation fails, returns a 400 status with validation errors.
 * @function
 * @param {Object} req - Express request object. Expected to contain history data in `req.body`.
 * @param {Object} res - Express response object.
 */
exports.createHistoryRecord = (req, res) => {
  console.log("Received history body:", req.body);

  try {
    // Validate the incoming request body
    const validatedInput = createHistoryInputSchema.parse(req.body);

    const newHistoryRecord = {
      id: randomUUID(),
      userId: validatedInput.userId,
      eventId: validatedInput.eventId,
      activityType: validatedInput.activityType,
      timestamp: new Date().toISOString(),
      details: validatedInput.details,
    };

    history.push(newHistoryRecord);

    // Best-effort DB persistence without breaking existing behavior
    (async () => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const status = validatedInput.activityType;
        const hours = 0;
        const dateParticipated = new Date();
        await prisma.volunteerHistory.create({
          data: {
            id: newHistoryRecord.id,
            userId: String(validatedInput.userId),
            eventId: String(validatedInput.eventId),
            status,
            hours,
            dateParticipated,
          }
        });
        await prisma.$disconnect();
      } catch (_e) { /* ignore DB issues in mock mode */ }
    })();

    return res.status(201).json(newHistoryRecord);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Handles GET request to retrieve a user's history records.
 * Validates the `userId` parameter against `getHistoryByUserIdSchema`.
 * If valid, filters the mock history data to find records for the specified user ID
 * and returns them with a 200 status. If no records are found, returns an empty array.
 * If validation fails, returns a 400 status with validation errors.
 * @function
 * @param {Object} req - Express request object. Expected to contain `userId` in `req.params`.
 * @param {Object} res - Express response object.
 */
exports.getHistoryByUserId = (req, res) => {
  try {
    console.log(" Received history body:", req.body);

    const { userId } = req.params;

    // Validate the userId parameter against the schema
    getHistoryByUserIdSchema.parse({ userId });

    const userHistory = history.filter((record) => record.userId === userId);
    return res.status(200).json(userHistory);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

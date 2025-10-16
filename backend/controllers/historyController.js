
const { v4: uuidv4 } = require('uuid');
const history = require('../data/history');
const { createHistoryInputSchema, getHistoryByUserIdSchema } = require('../validations/historySchema');

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
  try {
    // Validate the incoming request body
    const validatedInput = createHistoryInputSchema.parse(req.body);

    const newHistoryRecord = {
      id: uuidv4(),
      userId: validatedInput.userId,
      eventId: validatedInput.eventId,
      activityType: validatedInput.activityType,
      timestamp: new Date().toISOString(),
      details: validatedInput.details,
    };

    history.push(newHistoryRecord);
    return res.status(201).json(newHistoryRecord);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: 'Internal server error' });
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
    const { userId } = req.params;

    // Validate the userId parameter against the schema
    getHistoryByUserIdSchema.parse({ userId });

    const userHistory = history.filter(record => record.userId === userId);
    return res.status(200).json(userHistory);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: 'Internal server error' });
  }
};

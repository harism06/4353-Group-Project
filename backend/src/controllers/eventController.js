const { events } = require("../data/events");
const { eventSchema } = require("../validations/eventSchema");

/**
 * @file Event controller functions.
 * @module backend/controllers/eventController
 */

/**
 * Handles GET request to retrieve all events.
 * Returns the complete list of events from the mock data store.
 * @function
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 status with array of all events
 */
function getEvents(req, res) {
  // Return all events with 200 OK status
  res.status(200).json(events);
}

/**
 * Handles POST request to create a new event.
 * Validates the request body against `eventSchema` using Zod.
 * If valid, generates an ID, adds the event to mock data, and returns the new event with 201 status.
 * If validation fails, returns a 400 status with validation errors.
 * @function
 * @param {Object} req - Express request object. Expected to contain event data in `req.body`.
 * @param {Object} res - Express response object.
 * @returns {Object} 201 status with created event on success, 400 status with errors on failure
 */
function createEvent(req, res) {
  try {
    // Log incoming request body for debugging
    console.log("📩 Incoming POST body:", req.body);
    
    // Validate the incoming request body against Zod schema
    // This ensures all required fields are present and valid
    const validated = eventSchema.parse(req.body);
    
    // Create new event object with auto-incremented ID
    const newEvent = { id: events.length + 1, ...validated };
    
    // Add the new event to the mock events array
    events.push(newEvent);
    
    // Log successful creation for debugging
    console.log("✅ Created event:", newEvent);
    
    // Return the created event with 201 Created status
    res.status(201).json(newEvent);
  } catch (err) {
    // Log validation or other errors for debugging
    console.error("❌ Validation or other error:", err);
    
    // Return 400 Bad Request with error details
    // Zod errors are returned as err.errors, other errors as err.message
    res.status(400).json({ error: err.errors || err.message });
  }
}

module.exports = { getEvents, createEvent };

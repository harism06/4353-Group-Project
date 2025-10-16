
/**
 * @file Mock volunteer history data.
 * @module backend/data/history
 */

/**
 * @typedef {Object} HistoryRecord
 * @property {string} id - Unique identifier for the history record (UUID).
 * @property {string} userId - ID of the user whose history it is (UUID).
 * @property {string} eventId - ID of the event the user participated in (UUID).
 * @property {string} activityType - Type of activity (e.g., "Volunteer", "Attended", "Organized", max 100 characters).
 * @property {string} timestamp - ISO 8601 string for when the activity occurred.
 * @property {string} [details] - Additional details about the activity, optional.
 */

/**
 * Mock array to store history record objects.
 * @type {HistoryRecord[]}
 */
const history = [];

module.exports = history;

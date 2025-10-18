
/**
 * @file Mock notification data.
 * @module backend/data/notifications
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique identifier for the notification (UUID).
 * @property {string} userId - ID of the user receiving the notification (UUID).
 * @property {string} [eventId] - ID of the related event (UUID), optional.
 * @property {string} message - The notification message (max 500 characters).
 * @property {string} timestamp - ISO 8601 string for when the notification was created.
 * @property {boolean} read - Whether the user has read the notification.
 */

/**
 * Mock array to store notification objects.
 * @type {Notification[]}
 */
const notifications = [];

module.exports = notifications;

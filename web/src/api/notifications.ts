import axios from "axios";

const API_URL = "http://localhost:3001/api/notifications";

/**
 * Send a new notification to the backend
 * @param data - Notification data containing userId, message, and optional eventId
 * @returns Promise with the created notification
 */
export const sendNotification = async (data: {
  userId: string;
  message: string;
  eventId?: string;
}) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

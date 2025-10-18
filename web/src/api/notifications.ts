import axios from "axios";

const API_URL = "http://localhost:3001/api/notifications";

export type NotificationPayload = {
  userId: string;
  message: string;
  eventId?: string;
};

export type NotificationItem = {
  id: string;
  userId: string;
  message: string;
  eventId?: string;
  timestamp: string;
  read: boolean;
};

/**
 * Send a new notification to the backend.
 */
export const sendNotification = async (data: NotificationPayload) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

/**
 * Retrieve all notifications from the backend.
 */
export const getNotifications = async (): Promise<NotificationItem[]> => {
  const res = await axios.get(API_URL);
  return res.data || [];
};

/**
 * Mark all notifications as read.
 */
export const markAllNotificationsRead = async () => {
  await axios.post(`${API_URL}/mark-all-read`);
};

import axios from "axios";

const API_URL = "http://localhost:3001/api/history";

/**
 * Add a new history record to the backend
 * @param data - History record data containing userId, eventId, activityType, and optional details
 * @returns Promise with the created history record
 */
export const addHistory = async (data: any) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

/**
 * Get history records for a specific user
 * @param userId - UUID of the user
 * @returns Promise with array of history records
 */
export const getUserHistory = async (userId: string) => {
  const res = await axios.get(`${API_URL}/${userId}`);
  return res.data;
};

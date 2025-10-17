import axios from "axios";

const API_URL = "http://localhost:3001/api/notifications";

export const sendNotification = async (data: any) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

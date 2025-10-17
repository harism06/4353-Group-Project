import axios from "axios";

const API_URL = "http://localhost:3001/api/events";

export const getEvents = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createEvent = async (data: any) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

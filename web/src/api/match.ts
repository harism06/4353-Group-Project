import axios from "axios";

const API_URL = "http://localhost:3001/api/match";

export const getMatches = async (eventId: string) => {
  const res = await axios.get(`${API_URL}/${eventId}`);
  return res.data;
};

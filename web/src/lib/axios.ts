import axios from "axios";

const base = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"
).replace(/\/+$/, "");
const api = axios.create({ baseURL: `${base}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

console.log("[axios] baseURL:", api.defaults.baseURL);
export default api;

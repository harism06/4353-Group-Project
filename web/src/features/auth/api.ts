import axios from "axios";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from "./authTypes";

const BASE = import.meta.env.VITE_API_URL; // e.g. "http://localhost:3000"
// const USE_MOCK = !BASE; // if no API URL, we auto-mock
const USE_MOCK = true; // TEMPRORARY; force mock mode

const api = axios.create({
  baseURL: BASE || "/",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function delay<T>(value: T, ms = 600) {
  return new Promise<T>((res) => setTimeout(() => res(value), ms));
}

// --- Real or Mock calls ---

export async function login(data: LoginInput): Promise<AuthResponse> {
  if (USE_MOCK) {
    if (data.email === "test@example.com" && data.password.length >= 6) {
      return delay({
        user: { id: "u_1", name: "Test User", email: data.email },
        accessToken: "mock-token-123",
      });
    }
    throw new Error("Invalid email or password");
  }
  const res = await api.post<AuthResponse>("/api/auth/login", data);
  return res.data;
}

export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
  if (USE_MOCK) {
    if (data.password.length >= 8) {
      return delay({
        user: { id: "u_2", name: data.name, email: data.email },
        accessToken: "mock-token-456",
      });
    }
    throw new Error("Could not create account");
  }
  const res = await api.post<AuthResponse>("/api/auth/register", data);
  return res.data;
}

export async function fetchMe(): Promise<User> {
  if (USE_MOCK) {
    const raw = localStorage.getItem("user");
    if (!raw) throw new Error("No session");
    return delay(JSON.parse(raw) as User);
  }
  const res = await api.get<{ user: User }>("/api/auth/me");
  return res.data.user;
}

// --- Local storage helpers ---

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem("accessToken", auth.accessToken);
  localStorage.setItem("user", JSON.stringify(auth.user));
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

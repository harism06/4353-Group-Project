import axios from "axios";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
} from "./authTypes";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
});

// ---------- Auth API { message, user }) ----------
export async function loginUser(data: LoginInput): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/login", data);
  return res.data; // { message, user }
}

export async function registerUser(data: RegisterInput): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/api/auth/register", data);
  return res.data; // { message, user }
}

// ---------- Local session helpers (no JWT yet) ----------
export function saveAuth(auth: AuthResponse) {
  localStorage.setItem("token", "session"); // any non-empty string
  localStorage.setItem("userId", String(auth.user.id ?? ""));
  localStorage.setItem("user", JSON.stringify(auth.user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("user");
}

export async function fetchMe(): Promise<User | null> {
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as User) : null;
}

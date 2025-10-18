import api from "@/lib/axios";

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
};

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type AuthOk = {
  token: string;
  user: User;
};

export async function login(payload: LoginPayload): Promise<AuthOk> {
  const { data } = await api.post<AuthOk>("/auth/login", payload);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthOk> {
  const { data } = await api.post<AuthOk>("/auth/register", payload);
  return data;
}

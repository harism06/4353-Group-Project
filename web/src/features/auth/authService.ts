import api from "@/lib/axios";

export type User = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "volunteer";
};

export type LoginPayload = { identifier: string; password: string };
export type RegisterPayload = {
  username: string;
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

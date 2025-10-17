import api from "@/lib/axios";

export type User = { id: number | string; email: string; name?: string };

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  name?: string;
  email: string;
  password: string;
};

// Backend returns: { message: string; user: User }
export type AuthOk = { message: string; user: User };

export async function login(payload: LoginPayload): Promise<AuthOk> {
  const { data } = await api.post<AuthOk>("/api/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<AuthOk> {
  const { data } = await api.post<AuthOk>("/api/auth/register", payload);
  return data;
}

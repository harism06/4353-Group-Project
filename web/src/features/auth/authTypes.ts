export type User = {
  id: number | string;
  email: string;
  name?: string;
};

export type AuthResponse = {
  message: string;
  user: User;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

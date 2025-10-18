import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/axios";

type User = {
  id: string;
  email: string;
  role: "admin" | "user";
};

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
  logout: () => {},
});

function saveAuth(token: string, user: User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("userId", user.id);
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
}

async function fetchMe(): Promise<User | null> {
  try {
    const { data } = await api.get<{
      id: string;
      email: string;
      role: User["role"];
    }>("/auth/me");
    return data as User;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  // On mount, restore user from localStorage or ask the backend
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        return;
      } catch {
        // fall through to fetchMe
      }
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    (async () => {
      const me = await fetchMe();
      if (me) {
        setUser(me);
        // ensure localStorage is consistent
        saveAuth(token, me);
      }
    })();
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export function useAuth() {
  return useContext(AuthCtx);
}

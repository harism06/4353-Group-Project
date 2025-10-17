import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { clearAuth, fetchMe, saveAuth } from "./api";
import type { User, AuthResponse } from "./authTypes";

type AuthState = {
  user: User | null;
  loading: boolean;
  loginWithResponse: (auth: AuthResponse) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // check our simple session flag instead of "accessToken"
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    // no /me endpoint yet; just hydrate from localStorage
    fetchMe()
      .then((u) => setUser(u))
      .finally(() => setLoading(false));
  }, []);

  const loginWithResponse = (auth: AuthResponse) => {
    saveAuth(auth); // writes token=session, userId, user
    setUser(auth.user);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, loginWithResponse, logout }),
    [user, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

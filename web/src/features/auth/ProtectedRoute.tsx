import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./authContext";

export default function ProtectedRoute() {
  const location = useLocation();
  const { user } = useAuth?.() ?? { user: null as any };

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // allow through if we have either a context user or a local token flag
  const isAuthed = Boolean(user) || Boolean(token);

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

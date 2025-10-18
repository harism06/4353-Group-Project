// src/app/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "@/app/layouts/RootLayout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Events from "@/pages/Events";
import Profile from "@/pages/Profile";
import MatchPage from "@/features/matching/MatchPage";
import HistoryPage from "@/features/history/HistoryPage";
import { isAdmin } from "@/app/role";
import type { ReactElement } from "react";

function AdminRoute({ children }: { children: ReactElement }) {
  return isAdmin() ? children : <Navigate to="/dashboard" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },

      // public
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      // protected
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
          { path: "history", element: <HistoryPage /> },

          // admin-only routes
          {
            path: "events",
            element: (
              <AdminRoute>
                <Events />
              </AdminRoute>
            ),
          },
          {
            path: "match",
            element: (
              <AdminRoute>
                <MatchPage />
              </AdminRoute>
            ),
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

// src/app/router.tsx
import type { ReactNode } from "react";
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

function AdminRoute({ children }: { children: ReactNode }) {
  return isAdmin() ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },

      // Public auth routes
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      // Protected app routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "profile", element: <Profile /> },
          // Admin-only route (hidden in navbar and guarded here)
          {
            path: "match",
            element: (
              <AdminRoute>
                <MatchPage />
              </AdminRoute>
            ),
          },
          { path: "history", element: <HistoryPage /> },
          { path: "events", element: <Events /> },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

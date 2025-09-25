// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },

      // public auth routes
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },

      // protected routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "events", element: <Events /> },
          { path: "profile", element: <Profile /> },
          { path: "match", element: <MatchPage /> },
          { path: "history", element: <HistoryPage /> },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

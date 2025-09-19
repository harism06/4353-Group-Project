// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/app/layouts/RootLayout";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";

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
        children: [{ path: "dashboard", element: <Dashboard /> }],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

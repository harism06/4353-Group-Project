import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "./api";
import { useAuth } from "./authContext";
import type { LoginInput } from "./authTypes";
import { Link, useLocation, useNavigate } from "react-router-dom";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const LoginPage: React.FC = () => {
  const { loginWithResponse } = useAuth();
  const {
    register: rhf,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/dashboard";

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const auth = await login(values);
      loginWithResponse(auth);
      navigate(from, { replace: true });
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
      <p className="text-sm mb-6">Log in to continue.</p>

      {serverError && (
        <div
          aria-live="polite"
          className="mb-4 rounded-md border border-red-300 p-3 text-red-700"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-md border p-2"
            {...rhf("email")}
            autoComplete="email"
            autoFocus
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </label>

        <label className="block">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="mt-1 w-full rounded-md border p-2"
            {...rhf("password")}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </label>

        <button
          disabled={submitting}
          className="w-full rounded-md bg-black text-white p-2 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm mt-4">
        New here?{" "}
        <Link to="/register" className="underline">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUser } from "./api";
import { useAuth } from "./authContext";
import type { RegisterInput } from "./authTypes";
import { Link, useNavigate } from "react-router-dom";

const RegisterSchema = z.object({
  name: z.string().min(2, "Your name"),
  email: z.string().email("Valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "1 uppercase letter")
    .regex(/[a-z]/, "1 lowercase letter")
    .regex(/[0-9]/, "1 number"),
});

const RegisterPage: React.FC = () => {
  const { loginWithResponse } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values: RegisterInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const auth = await registerUser(values);
      loginWithResponse(auth); // auto-login after register

      navigate("/profile", { replace: true });
    } catch (e: any) {
      setServerError(e?.response?.data?.message || "Could not create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-2">Create your account</h1>
      <p className="text-sm mb-6">It takes less than a minute.</p>

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
          <span className="text-sm">Full name</span>
          <input
            className="mt-1 w-full rounded-md border p-2"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </label>

        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            className="mt-1 w-full rounded-md border p-2"
            {...register("email")}
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
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Use 8+ chars, with upper, lower, and a number.
          </p>
        </label>

        <button
          disabled={submitting}
          className="w-full rounded-md bg-black text-white p-2 disabled:opacity-60"
          type="submit"
        >
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-sm mt-4">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;

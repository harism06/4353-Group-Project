import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "./authService";
import { useAuth } from "./authContext";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});
type FormData = z.infer<typeof Schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(Schema) });

  const onSubmit = async (values: FormData) => {
    setError("");
    try {
      const { token, user } = await registerUser({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      // persist auth
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);

      // update context (optional but nice for Navbar, etc.)
      setUser(user);

      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      setError("Registration failed");
    }
  };

  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-semibold mb-4 text-center">Register</h1>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            {...register("name")}
            className="w-full border rounded-md p-2"
            placeholder="Jane Doe"
          />
          {errors.name && (
            <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full border rounded-md p-2"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full border rounded-md p-2"
            placeholder="•••••••"
          />
          {errors.password && (
            <p className="text-red-600 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 disabled:opacity-60"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm mt-3">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}

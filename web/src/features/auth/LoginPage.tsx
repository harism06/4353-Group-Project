import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginUser } from "./authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const { token, user } = await loginUser({ email, password });

      // store token & user so axios interceptor adds Authorization automatically
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Request failed with status code 404");
    }
  }

  const hasError = Boolean(error);

  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>

      {hasError && (
        <p role="alert" className="text-red-600 text-sm mb-3" id="login-error">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
            placeholder="admin@test.com"
            required
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? "login-error" : undefined}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
            placeholder="secret12"
            required
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? "login-error" : undefined}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
        >
          Login
        </button>

        <p className="text-sm mt-3">
          Don’t have an account?{" "}
          <Link to="/register" className="underline">
            Register
          </Link>
        </p>
      </form>
    </section>
  );
}

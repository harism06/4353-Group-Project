import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginUser } from "./authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const { token, user } = await loginUser({ identifier, password });

      // store token & user so axios interceptor adds Authorization automatically
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Login failed. Check your credentials and try again.");
    }
  }

  const hasError = Boolean(error);

  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-gray-100">
      <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>

      {hasError && (
        <p role="alert" className="text-red-600 text-sm mb-3" id="login-error">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="identifier"
            className="block text-sm font-medium mb-1"
          >
            Email or Username
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border rounded-md p-2 bg-gray-200 focus:ring focus:ring-blue-200"
            placeholder="admin or admin@test.com"
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
            className="w-full border rounded-md p-2 bg-gray-200 focus:ring focus:ring-blue-200"
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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios"; // shared axios instance

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // baseURL already has /api, so this hits /api/auth/login
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data; // { token, user: { id, email, role } }

      // save auth so interceptor sends token on every request
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userId", user.id);

      navigate("/dashboard");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setError("Invalid email or password.");
      else if (status === 404)
        setError("Login endpoint not found (check backend route).");
      else setError("Login failed. Please try again.");
      console.error("Login failed:", status, err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow-sm bg-white">
      <h1 className="text-2xl font-semibold mb-4 text-center">Login</h1>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
            placeholder="admin@test.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-md p-2 focus:ring focus:ring-blue-200"
            placeholder="secret12"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Login"}
        </button>
      </form>
    </section>
  );
}

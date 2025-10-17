import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "./api";
import { useAuth } from "./authContext";

export default function LoginPage() {
  const nav = useNavigate();
  const { loginWithResponse } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(form); // backend returns { message, user }
      if (!res?.user) throw new Error("No user in response");

      // ✅ Use context helper to store token + user in localStorage
      loginWithResponse(res);

      // After login → go to dashboard
      nav("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      {error && <div className="text-red-600 mb-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border rounded p-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border rounded p-2"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-3 text-sm">
        Don’t have an account?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}

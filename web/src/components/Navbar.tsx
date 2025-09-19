import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/authContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const base = "px-3 py-2 rounded hover:bg-zinc-800";
  const active = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${base} bg-zinc-800` : base;

  return (
    <header className="border-b border-zinc-800">
      <nav className="container flex items-center gap-4 h-14">
        <Link to="/" className="font-semibold text-brand-500">
          Project
        </Link>
        <NavLink to="/" className={active}>
          Home
        </NavLink>
        {!user && (
          <NavLink to="/login" className={active}>
            Login
          </NavLink>
        )}
        {!user && (
          <NavLink to="/register" className={active}>
            Register
          </NavLink>
        )}
        {user && (
          <NavLink to="/dashboard" className={active}>
            Dashboard
          </NavLink>
        )}
        {user && (
          <button
            onClick={logout}
            className="ml-auto px-3 py-2 rounded border border-zinc-700"
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

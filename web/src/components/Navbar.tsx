import { useNavigate, NavLink } from "react-router-dom";

export default function Navbar() {
  const nav = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const role = user?.role ?? null;

  const link = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded transition ${
      isActive
        ? "text-white bg-black"
        : "text-blue-600 hover:text-blue-800 hover:underline"
    }`;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    nav("/login");
  }

  return (
    <header className="border-b">
      <nav className="mx-auto max-w-5xl flex items-center justify-between p-3">
        <div className="font-semibold text-lg">Volunteer Connect</div>

        <div className="flex items-center gap-2">
          <NavLink to="/" className={link}>
            Home
          </NavLink>

          {token ? (
            <>
              <NavLink to="/dashboard" className={link}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" className={link}>
                Profile
              </NavLink>

              {/* Use existing route paths */}
              {(role === "admin" || role == null) && (
                <NavLink to="/events" className={link}>
                  Add Event
                </NavLink>
              )}
              {(role === "user" || role == null) && (
                <NavLink to="/match" className={link}>
                  Match Events
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 rounded border"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>
                Login
              </NavLink>
              <NavLink to="/register" className={link}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

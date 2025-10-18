import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { isAdmin, isVolunteer } from "@/app/role";
import {
  getMyNotifications,
  markAllRead,
  type NotificationItem,
} from "@/api/notifications";

function useUnreadCount() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUnread(0);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const items: NotificationItem[] = await getMyNotifications();
        if (!mounted) return;
        setUnread(items.filter((n) => !n.read).length);
      } catch {
        if (!mounted) return;
        setUnread(0);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { unread, setUnread };
}

export default function Navbar() {
  const nav = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { unread, setUnread } = useUnreadCount();

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

  async function handleBellClick() {
    try {
      await markAllRead();
      setUnread(0);
    } catch {
      // ignore
    }
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

              {/* Admins only see Match */}
              {isAdmin() && (
                <NavLink to="/match" className={link}>
                  Match
                </NavLink>
              )}

              {/* Everyone can see History */}
              <NavLink to="/history" className={link}>
                History
              </NavLink>

              {/* Admins see Add Event */}
              {isAdmin() && (
                <NavLink to="/events" className={link}>
                  Add Event
                </NavLink>
              )}

              {/* Bell */}
              <button
                aria-label="Notifications"
                onClick={handleBellClick}
                className="relative ml-1 px-3 py-2 rounded border"
                title={unread ? `${unread} unread` : "No unread notifications"}
              >
                🔔
                {unread > 0 && (
                  <span
                    className="absolute -top-1 -right-1 inline-flex items-center justify-center
                                   text-[10px] leading-none rounded-full bg-red-600 text-white w-4 h-4"
                  >
                    {unread}
                  </span>
                )}
              </button>

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

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsRead,
} from "@/api/notifications";
import type { NotificationItem } from "@/api/notifications";

export default function Navbar() {
  const nav = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const role = user?.role ?? null;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pullNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    pullNotifications();
    const interval = window.setInterval(() => {
      pullNotifications();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [pullNotifications, token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
    if (!showDropdown) {
      pullNotifications();
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

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
    <header className="border-b relative">
      <nav className="mx-auto max-w-5xl flex items-center justify-between p-3">
        <div className="font-semibold text-lg">Volunteer Connect</div>

        <div className="flex items-center gap-3 relative">
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

              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="relative text-2xl hover:scale-110 transition"
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-black border rounded-lg shadow-lg z-50">
                    <div className="flex justify-between items-center px-3 py-2 border-b">
                      <span className="font-semibold">Notifications</span>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500">
                        No notifications
                      </p>
                    ) : (
                      <ul className="max-h-60 overflow-y-auto">
                        {notifications.map((n, i) => (
                          <li
                            key={i}
                            className={`px-3 py-2 border-b ${
                              n.read ? "bg-gray-100" : "bg-blue-50"
                            }`}
                          >
                            <p className="text-sm">{n.message}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                n.timestamp || Date.now()
                              ).toLocaleString()}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

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

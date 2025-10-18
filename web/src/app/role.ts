// web/src/app/role.ts

type UserLike = { role?: string | null } | null;

// Safely read user object from localStorage
function getUser(): UserLike {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Normalize casing and spacing
function norm(role?: string | null) {
  return (role ?? "").trim().toLowerCase();
}

// Admin check (accepts several variants)
export function isAdmin(): boolean {
  const r = norm(getUser()?.role);
  return r === "admin" || r === "administrator";
}

// Volunteer check (default non-admin user)
export function isVolunteer(): boolean {
  const r = norm(getUser()?.role);
  return r === "volunteer" || r === "user";
}

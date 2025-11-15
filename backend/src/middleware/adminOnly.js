// src/middleware/adminOnly.js
import { requireAuth, requireRole } from "./auth.js";

/**
 * Middleware that ensures:
 *  - user is authenticated
 *  - user has role "admin"
 */
export function requireAdmin(req, res, next) {
  // First run requireAuth; on success, run requireRole("admin")
  return requireAuth(req, res, () => {
    return requireRole("admin")(req, res, next);
  });
}

/**
 * @file Admin authentication middleware for restricting access to admin routes.
 * @module backend/middleware/adminAuth
 * @description Middleware to validate JWT tokens and ensure user has admin role.
 * This middleware should be used on all /admin/* routes to restrict access.
 */

/**
 * Middleware to verify admin access using JWT token validation.
 * Checks for Authorization header with Bearer token and validates user role.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void} Calls next() if admin access is granted, otherwise sends 401 response.
 *
 * @example
 * // Usage in routes:
 * router.get('/admin/reports/events', adminAuth, getEventsReport);
 */
function adminAuth(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // TODO: Implement actual JWT verification when Azamat completes JWT setup
  // For now, accept "admin-token" as a valid admin token for testing
  // In production, this should verify the JWT and check the role claim

  // Mock validation - in production, verify JWT and extract role
  if (token === "admin-token" || token === "mock-admin-token") {
    // Attach admin user info to request for use in controllers
    req.user = { role: "admin", id: "admin-user-id" };
    return next();
  }

  // Check if token exists but user is not admin
  if (token && token !== "admin-token" && token !== "mock-admin-token") {
    return res.status(401).json({ message: "Unauthorized: Admin access required" });
  }

  return res.status(401).json({ message: "Unauthorized: Invalid token" });
}

module.exports = adminAuth;


import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { users } from "../store/mem.js";

const r = Router();
const sanitize = (u) => ({ id: u.id, email: u.email, role: u.role });

// Admin: list all users (optional)
r.get("/users", requireAuth, requireRole("admin"), (_req, res) => {
  res.json(users.map(sanitize));
});

// Self or Admin: get user by id
r.get("/users/:id", requireAuth, (req, res) => {
  const u = users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: "Not found" });
  const isSelf = req.user.sub === u.id;
  const isAdmin = req.user.role === "admin";
  if (!isSelf && !isAdmin) return res.status(403).json({ error: "Forbidden" });
  res.json(sanitize(u));
});

export default r;

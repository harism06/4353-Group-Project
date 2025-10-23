import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import prisma from "../db/prisma.js";

const r = Router();
const sanitize = (u) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

// Admin: list all users (optional)
r.get("/users", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const records = await prisma.userCredentials.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.json(records.map(sanitize));
  } catch (err) {
    console.error("[users] list failed", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

// Self or Admin: get user by id
r.get("/users/:id", requireAuth, async (req, res) => {
  try {
    const u = await prisma.userCredentials.findUnique({
      where: { id: req.params.id },
    });
    if (!u) return res.status(404).json({ error: "Not found" });
    const isSelf = req.user.sub === u.id;
    const isAdmin = req.user.role === "admin";
    if (!isSelf && !isAdmin)
      return res.status(403).json({ error: "Forbidden" });
    res.json(sanitize(u));
  } catch (err) {
    console.error("[users] detail failed", err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

export default r;

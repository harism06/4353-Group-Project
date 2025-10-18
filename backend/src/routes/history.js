import { Router } from "express";
import { z } from "zod";
import { history } from "../store/mem.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { randomUUID } from "crypto";

const r = Router();
const assign = z.object({
  userId: z.string(),
  eventId: z.string(),
  note: z.string().optional(),
});

r.get("/history/:userId", (req, res) => {
  res.json(history.filter((h) => h.userId === req.params.userId));
});

r.post("/history", requireAuth, requireRole("admin"), (req, res) => {
  const p = assign.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const row = {
    id: randomUUID(),
    ...p.data,
    status: "assigned",
    assignedAt: new Date().toISOString(),
  };
  history.push(row);
  res.status(201).json(row);
});

export default r;

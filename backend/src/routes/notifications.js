import { Router } from "express";
import { z } from "zod";
import { notifications } from "../store/mem.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "crypto";

const r = Router();
const create = z.object({ userId: z.string(), message: z.string().min(1) });
const patch = z.object({ read: z.boolean() });

r.get("/notifications", requireAuth, (req, res) => {
  const userId = req.query.userId || req.user.sub;
  res.json(notifications.filter((n) => n.userId === userId));
});

r.post("/notifications", requireAuth, (req, res) => {
  const p = create.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const n = {
    id: randomUUID(),
    userId: p.data.userId,
    message: p.data.message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.push(n);
  res.status(201).json(n);
});

r.patch("/notifications/:id", requireAuth, (req, res) => {
  const p = patch.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const i = notifications.findIndex((n) => n.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "Not found" });
  notifications[i] = { ...notifications[i], read: p.data.read };
  res.json(notifications[i]);
});

export default r;

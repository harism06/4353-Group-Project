import { Router } from "express";
import { z } from "zod";
import { events } from "../store/mem.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { randomUUID } from "crypto";

const r = Router();
const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  requiredSkills: z.array(z.string()).default([]),
  urgency: z.enum(["low", "medium", "high"]).default("low"),
  eventDate: z.string().min(1),
});

r.get("/events", (_req, res) => res.json(events));

r.post("/events", requireAuth, requireRole("admin"), (req, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const doc = { id: randomUUID(), ...p.data };
  events.push(doc);
  res.status(201).json(doc);
});

export default r;

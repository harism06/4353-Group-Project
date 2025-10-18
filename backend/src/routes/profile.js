import { Router } from "express";
import { z } from "zod";
import { profiles } from "../store/mem.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

// what a profile looks like
const schema = z.object({
  fullName: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipcode: z.string().optional(),
  skills: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  availability: z.string().optional(),
});

// get my profile (returns null if none yet)
r.get("/profiles/me", requireAuth, (req, res) => {
  const me = profiles.find((p) => p.userId === req.user.sub) || null;
  res.json(me);
});

// create/update my profile
r.post("/profiles", requireAuth, (req, res) => {
  const p = schema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());

  const idx = profiles.findIndex((pf) => pf.userId === req.user.sub);
  const doc = { userId: req.user.sub, ...p.data };

  if (idx === -1) profiles.push(doc);
  else profiles[idx] = { ...profiles[idx], ...doc };

  res.status(201).json(doc);
});

export default r;

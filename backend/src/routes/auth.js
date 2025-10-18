import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { users } from "../store/mem.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { randomUUID } from "crypto";

const r = Router();
const creds = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
const reg = creds.extend({
  role: z.enum(["admin", "volunteer"]).default("volunteer"),
});

r.post("/auth/register", async (req, res) => {
  const p = reg.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const { email, password, role } = p.data;
  if (users.some((u) => u.email === email))
    return res.status(409).json({ error: "Email already used" });
  const passwordHash = await bcrypt.hash(password, 10);
  const id = randomUUID();
  users.push({ id, email, passwordHash, role });
  const token = signToken({ id, role });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.status(201).json({ token, user: { id, email, role } });
});

r.post("/auth/login", async (req, res) => {
  const p = creds.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const { email, password } = p.data;
  const u = users.find((u) => u.email === email);
  if (!u || !(await bcrypt.compare(password, u.passwordHash)))
    return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken({ id: u.id, role: u.role });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  res.json({ token, user: { id: u.id, email: u.email, role: u.role } });
});

r.get("/auth/me", requireAuth, (req, res) =>
  res.json({ id: req.user.sub, role: req.user.role })
);
r.post("/auth/logout", requireAuth, (_req, res) => {
  res.clearCookie("token");
  res.status(204).end();
});

export default r;

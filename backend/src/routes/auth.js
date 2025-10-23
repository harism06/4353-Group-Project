import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { signToken, requireAuth } from "../middleware/auth.js";

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
  try {
    const existing = await prisma.userCredentials.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return res.status(409).json({ error: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.userCredentials.create({
      data: { email, password: passwordHash, role },
      select: { id: true, email: true, role: true },
    });

    const token = signToken({ id: created.id, role: created.role });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    res.status(201).json({ token, user: created });
  } catch (err) {
    console.error("[auth] register failed", err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

r.post("/auth/login", async (req, res) => {
  const p = creds.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const { email, password } = p.data;
  try {
    const user = await prisma.userCredentials.findUnique({
      where: { email },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id, role: user.role });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("[auth] login failed", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

r.get("/auth/me", requireAuth, (req, res) =>
  res.json({ id: req.user.sub, role: req.user.role })
);
r.post("/auth/logout", requireAuth, (_req, res) => {
  res.clearCookie("token");
  res.status(204).end();
});

export default r;

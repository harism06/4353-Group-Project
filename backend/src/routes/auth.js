import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { signToken, requireAuth } from "../middleware/auth.js";

const r = Router();

const identifier = z
  .string()
  .min(1, "Identifier is required")
  .trim()
  .transform((value) => value.toLowerCase());

const loginSchema = z.object({
  identifier,
  password: z.string().min(6),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .trim()
    .regex(/^[a-z0-9_]+$/i, "Only letters, numbers and underscores")
    .transform((value) => value.toLowerCase()),
  email: z
    .string()
    .email()
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(6),
  role: z.enum(["admin", "volunteer"]).default("volunteer"),
});

r.post("/auth/register", async (req, res) => {
  const p = registerSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const { email, password, role, username } = p.data;
  try {
    const existing = await prisma.userCredentials.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true, email: true, username: true },
    });
    if (existing) {
      const conflictOnEmail = existing.email === email;
      return res.status(409).json({
        error: conflictOnEmail ? "Email already used" : "Username already used",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.userCredentials.create({
      data: {
        username,
        email,
        password: passwordHash,
        role,
      },
      select: { id: true, username: true, email: true, role: true },
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
  const p = loginSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json(p.error.flatten());
  const { identifier: rawIdentifier, password } = p.data;
  const identifierValue = rawIdentifier.toLowerCase();
  try {
    const user = await prisma.userCredentials.findFirst({
      where: {
        OR: [{ email: identifierValue }, { username: identifierValue }],
      },
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[auth] login failed", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

r.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const me = await prisma.userCredentials.findUnique({
      where: { id: req.user.sub },
      select: { id: true, username: true, email: true, role: true },
    });
    if (!me) return res.status(404).json({ error: "Not found" });
    res.json(me);
  } catch (err) {
    console.error("[auth] me failed", err);
    res.status(500).json({ error: "Failed to load session" });
  }
});
r.post("/auth/logout", requireAuth, (_req, res) => {
  res.clearCookie("token");
  res.status(204).end();
});

export default r;

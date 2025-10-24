import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "../validations/authSchema.js";

const r = Router();

const isProd = process.env.NODE_ENV === "production";
const cookieOpts = {
  httpOnly: true,
  sameSite: isProd ? "none" : "lax",
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/register
 * (normalized inputs + role default)
 */
r.post("/auth/register", async (req, res) => {
  const normalized = {
    username: String(req.body?.username ?? "").trim(),
    email: String(req.body?.email ?? "").trim(),
    password: String(req.body?.password ?? ""),
    role: req.body?.role ?? "volunteer",
  };

  const p = registerSchema.safeParse(normalized);
  if (!p.success) {
    return res.status(400).json(p.error.flatten());
  }

  const { email, password, role, username } = p.data;

  try {
    const existing = await prisma.userCredentials.findFirst({
      where: { OR: [{ email }, { username }] },
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
        role: role ?? "volunteer",
      },
      select: { id: true, username: true, email: true, role: true },
    });

    const token = signToken({ id: created.id, role: created.role });
    res.cookie("token", token, cookieOpts);
    return res.status(201).json({ token, user: created });
  } catch (err) {
    if (err?.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(",")
        : err.meta?.target || "";
      const which = target.includes("email") ? "Email" : "Username";
      return res.status(409).json({ error: `${which} already used` });
    }
    console.error("[auth] register failed", err);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

/**
 * POST /api/auth/login
 * Accepts { identifier } or { email } or { username } + { password }
 */
r.post("/auth/login", async (req, res) => {
  const body = {
    identifier: (
      req.body?.identifier ??
      req.body?.email ??
      req.body?.username ??
      ""
    )
      .toString()
      .trim()
      .toLowerCase(),
    password: req.body?.password,
  };

  const p = loginSchema.safeParse(body);
  if (!p.success) {
    const { fieldErrors, formErrors } = p.error.flatten();
    return res.status(400).json({ formErrors, fieldErrors });
  }

  const { identifier: rawIdentifier, password } = p.data;

  try {
    const user = await prisma.userCredentials.findFirst({
      where: { OR: [{ email: rawIdentifier }, { username: rawIdentifier }] },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken({ id: user.id, role: user.role });
    res.cookie("token", token, cookieOpts);

    return res.json({
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
    return res.status(500).json({ error: "Failed to login" });
  }
});

/**
 * GET /api/auth/me
 */
r.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const me = await prisma.userCredentials.findUnique({
      where: { id: req.user.sub },
      select: { id: true, username: true, email: true, role: true },
    });
    if (!me) return res.status(404).json({ error: "Not found" });
    return res.json(me);
  } catch (err) {
    console.error("[auth] me failed", err);
    return res.status(500).json({ error: "Failed to load session" });
  }
});

/**
 * POST /api/auth/logout
 */
r.post("/auth/logout", requireAuth, (_req, res) => {
  res.clearCookie("token", cookieOpts);
  return res.status(204).end();
});

export default r;

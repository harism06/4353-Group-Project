import { Router } from "express";
import { z } from "zod";
import prisma from "../db/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { profiles } from "../store/mem.js";

const r = Router();

const baseSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  location: z.string().min(2).max(120),
  requiredSkills: z.array(z.string().min(1)).min(1),
  urgency: z.enum(["low", "medium", "high"]),
  eventDate: z
    .string()
    .min(4)
    .refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date"),
});

const idSchema = z.object({
  id: z.string().trim().min(1),
});

const serializeEvent = (evt) => ({
  id: evt.id,
  name: evt.name,
  description: evt.description,
  location: evt.location,
  requiredSkills: Array.isArray(evt.skills) ? evt.skills : [],
  urgency: evt.urgency,
  eventDate: evt.eventDate.toISOString(),
  createdAt: evt.createdAt.toISOString(),
  updatedAt: evt.updatedAt.toISOString(),
});

const buildEventData = (payload) => {
  const eventDate = new Date(payload.eventDate);
  return {
    name: payload.name.trim(),
    description: payload.description.trim(),
    location: payload.location.trim(),
    skills: [...new Set(payload.requiredSkills.map((s) => s.trim()))],
    urgency: payload.urgency,
    eventDate,
  };
};

r.get("/events", async (_req, res) => {
  try {
    const rows = await prisma.eventDetails.findMany({
      orderBy: { eventDate: "asc" },
    });
    res.json(rows.map(serializeEvent));
  } catch (err) {
    console.error("[events] list failed", err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

r.get("/events/:id", async (req, res) => {
  const params = idSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  try {
    const event = await prisma.eventDetails.findUnique({
      where: { id: params.data.id },
    });
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(serializeEvent(event));
  } catch (err) {
    console.error("[events] detail failed", err);
    res.status(500).json({ error: "Failed to load event" });
  }
});

r.post("/events", requireAuth, requireRole("admin"), async (req, res) => {
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const created = await prisma.eventDetails.create({
      data: buildEventData(parsed.data),
    });
    res.status(201).json(serializeEvent(created));
  } catch (err) {
    console.error("[events] create failed", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

r.put("/events/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const params = idSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const parsed = baseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const updated = await prisma.eventDetails.update({
      where: { id: params.data.id },
      data: buildEventData(parsed.data),
    });
    res.json(serializeEvent(updated));
  } catch (err) {
    console.error("[events] update failed", err);
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(500).json({ error: "Failed to update event" });
  }
});

r.delete(
  "/events/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const params = idSchema.safeParse(req.params);
    if (!params.success) return res.status(400).json(params.error.flatten());
    try {
      await prisma.eventDetails.delete({
        where: { id: params.data.id },
      });
      res.status(204).end();
    } catch (err) {
      console.error("[events] delete failed", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(500).json({ error: "Failed to delete event" });
    }
  }
);

r.get(
  "/events/:id/matches",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const params = idSchema.safeParse(req.params);
    if (!params.success) return res.status(400).json(params.error.flatten());
    try {
      const event = await prisma.eventDetails.findUnique({
        where: { id: params.data.id },
      });
      if (!event) return res.status(404).json({ error: "Event not found" });

      const skills = new Set(
        Array.isArray(event.skills) ? event.skills.map((s) => s.toLowerCase()) : []
      );
      const normalizedLocation = event.location.trim().toLowerCase();

      const matches = profiles
        .map((profile) => {
          const volunteerSkills = (profile.skills ?? []).map((s) =>
            s.toLowerCase()
          );
          const skillMatches = volunteerSkills.filter((s) => skills.has(s));
          const locationMatch =
            profile.city?.trim().toLowerCase() === normalizedLocation;
          const score = skillMatches.length * 2 + (locationMatch ? 1 : 0);
          if (!score) return null;
          return {
            volunteerId: profile.userId,
            volunteerName: profile.fullName,
            skillMatches: skillMatches.length,
            locationMatch,
            score,
            reason: locationMatch
              ? `Shares ${skillMatches.length} skill(s) & same city`
              : `Shares ${skillMatches.length} skill(s)`,
          };
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            b.score - a.score || a.volunteerName.localeCompare(b.volunteerName)
        );

      res.json(matches);
    } catch (err) {
      console.error("[events] matches failed", err);
      res.status(500).json({ error: "Failed to generate matches" });
    }
  }
);

export default r;

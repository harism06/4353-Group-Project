import { Router } from "express";
import { profiles } from "../store/mem.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import prisma from "../db/prisma.js";

const r = Router();

function score(vol, ev) {
  const vskills = new Set(vol?.skills ?? []);
  return (ev.requiredSkills ?? []).reduce(
    (s, sk) => s + (vskills.has(sk) ? 1 : 0),
    0
  );
}

r.get(
  "/match/suggestions",
  requireAuth,
  requireRole("admin"),
  async (_req, res) => {
    try {
      const storedEvents = await prisma.eventDetails.findMany({
        orderBy: { eventDate: "asc" },
      });
      const vols = profiles.map((p) => ({
        userId: p.userId,
        name: p.fullName,
        skills: p.skills ?? [],
      }));
      const rows = [];
      for (const v of vols) {
        for (const e of storedEvents) {
          const normalizedEvent = {
            ...e,
            requiredSkills: Array.isArray(e.skills) ? e.skills : [],
            eventDate: e.eventDate.toISOString(),
          };
          const s = score(v, normalizedEvent);
          if (s > 0)
            rows.push({
              id: `${v.userId}-${e.id}`,
              volunteer: { id: v.userId, name: v.name },
              event: { id: e.id, title: e.name, date: normalizedEvent.eventDate },
              score: s,
              reason: `Matches ${s} skill(s)`,
            });
        }
      }
      rows.sort(
        (a, b) =>
          b.score - a.score || new Date(a.event.date) - new Date(b.event.date)
      );
      res.json(rows);
    } catch (err) {
      console.error("[match] suggestions failed", err);
      res.status(500).json({ error: "Failed to build suggestions" });
    }
  }
);

export default r;

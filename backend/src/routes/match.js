import { Router } from "express";
import { profiles, events } from "../store/mem.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const r = Router();

function score(vol, ev) {
  const vskills = new Set(vol?.skills ?? []);
  return (ev.requiredSkills ?? []).reduce(
    (s, sk) => s + (vskills.has(sk) ? 1 : 0),
    0
  );
}

r.get("/match/suggestions", requireAuth, requireRole("admin"), (_req, res) => {
  const vols = profiles.map((p) => ({
    userId: p.userId,
    name: p.fullName,
    skills: p.skills ?? [],
  }));
  const rows = [];
  for (const v of vols) {
    for (const e of events) {
      const s = score(v, e);
      if (s > 0)
        rows.push({
          id: `${v.userId}-${e.id}`,
          volunteer: { id: v.userId, name: v.name },
          event: { id: e.id, title: e.name, date: e.eventDate },
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
});

export default r;

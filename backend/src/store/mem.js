import bcrypt from "bcrypt";
import prisma from "../db/prisma.js";

export const profiles = []; // {userId, fullName, skills[], availability, ...}
export const events = []; // kept for legacy references
export const history = []; // {id,userId,eventId,status,note,assignedAt}
export const notifications = []; // {id,userId,message,createdAt,read}

let seeded = false;

export async function seedMem() {
  if (seeded) return;
  seeded = true;

  const adminPwd = await bcrypt.hash("secret12", 10);
  const volPwd = await bcrypt.hash("secret12", 10);

  const admin =
    (await prisma.userCredentials.findUnique({
      where: { email: "admin@test.com" },
    })) ||
    (await prisma.userCredentials.create({
      data: {
        username: "admin",
        email: "admin@test.com",
        password: adminPwd,
        role: "admin",
      },
    }));

  const volunteer =
    (await prisma.userCredentials.findUnique({
      where: { email: "vol@test.com" },
    })) ||
    (await prisma.userCredentials.create({
      data: {
        username: "volunteer",
        email: "vol@test.com",
        password: volPwd,
        role: "volunteer",
      },
    }));

  if (!profiles.some((p) => p.userId === admin.id)) {
    profiles.push({
      userId: admin.id,
      fullName: "Admin User",
      city: "Houston",
      state: "TX",
      skills: ["Administration"],
      availability: "Weekdays",
    });
  }

  if (!profiles.some((p) => p.userId === volunteer.id)) {
    profiles.push({
      userId: volunteer.id,
      fullName: "Sample Volunteer",
      city: "Houston",
      state: "TX",
      skills: ["Cooking", "Teaching"],
      availability: "Weekends",
    });
  }

  const seededEvents = await prisma.eventDetails.count();
  if (!seededEvents) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const twoDays = new Date(Date.now() + 2 * 86400000).toISOString();
    try {
      await prisma.eventDetails.createMany({
        data: [
          {
            name: "Community Kitchen",
            description: "Prepare and serve meals to neighbors in need.",
            location: "Downtown",
            skills: ["Cooking", "Organization"],
            urgency: "high",
            eventDate: tomorrow,
          },
          {
            name: "After-School Tutoring",
            description: "Help students with homework and enrichment.",
            location: "West Library",
            skills: ["Teaching", "Patience"],
            urgency: "medium",
            eventDate: twoDays,
          },
        ],
      });
    } catch {
      // ignore duplicate inserts on re-seed
    }
  }

  const persisted = await prisma.eventDetails.findMany({
    orderBy: { eventDate: "asc" },
  });
  events.splice(
    0,
    events.length,
    ...persisted.map((ev) => ({
      id: ev.id,
      name: ev.name,
      description: ev.description,
      location: ev.location,
      requiredSkills: Array.isArray(ev.skills) ? ev.skills : [],
      urgency: ev.urgency,
      eventDate: ev.eventDate.toISOString(),
    }))
  );
}

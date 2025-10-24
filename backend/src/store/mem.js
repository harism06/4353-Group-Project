import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import prisma from "../db/prisma.js";

export const profiles = []; // {userId, fullName, skills[], availability, ...}
export const events = []; // {id,name,description,requiredSkills[],urgency,eventDate,location}
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

  if (!events.length) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const twoDays = new Date(Date.now() + 2 * 86400000).toISOString();

    events.push(
      {
        id: randomUUID(),
        name: "Community Kitchen",
        description: "Prepare & serve",
        requiredSkills: ["Cooking"],
        urgency: "high",
        eventDate: tomorrow,
        location: "Downtown",
      },
      {
        id: randomUUID(),
        name: "After-School Tutoring",
        description: "Help students",
        requiredSkills: ["Teaching"],
        urgency: "medium",
        eventDate: twoDays,
        location: "West Library",
      }
    );
  }
}

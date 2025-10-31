import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/server.js";
import prisma from "../src/db/prisma.js";
import { profiles } from "../src/store/mem.js";

const BASE = "/api/match/suggestions";
const PASSWORD = "Secret123!";
const createdEmails = new Set();

const makeSlug = (label) =>
  `${label}_${Date.now()}_${Math.random().toString(16).slice(2)}`
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();

const makeId = (label) => makeSlug(`match_${label}`).slice(0, 28);

async function registerUser(role = "volunteer") {
  const username = makeId(role);
  const email = `${username}@example.com`;
  const res = await request(app).post("/api/auth/register").send({
    username,
    email,
    password: PASSWORD,
    role,
  });
  if (res.statusCode !== 201) {
    throw new Error(`Failed to create ${role}: ${res.text}`);
  }
  createdEmails.add(email);
  return {
    token: res.body.token,
    user: res.body.user,
    authHeader: { Authorization: `Bearer ${res.body.token}` },
  };
}

beforeEach(async () => {
  profiles.splice(0, profiles.length);
  await prisma.eventDetails.deleteMany({
    where: { name: { startsWith: "Match Test" } },
  });
});

afterAll(async () => {
  profiles.splice(0, profiles.length);
  await prisma.eventDetails.deleteMany({
    where: { name: { startsWith: "Match Test" } },
  });
  if (createdEmails.size) {
    await prisma.userCredentials.deleteMany({
      where: { email: { in: Array.from(createdEmails) } },
    });
  }
  await prisma.$disconnect();
});

describe("/api/match/suggestions", () => {
  it("requires authentication", async () => {
    const res = await request(app).get(BASE);
    expect(res.statusCode).toBe(401);
  });

  it("rejects non-admin users", async () => {
    const volunteer = await registerUser("volunteer");
    const res = await request(app).get(BASE).set(volunteer.authHeader);
    expect(res.statusCode).toBe(403);
  });

  it("returns ranked suggestions for admins", async () => {
    const admin = await registerUser("admin");
    const volunteer = await registerUser("volunteer");

    profiles.push({
      userId: volunteer.user.id,
      fullName: "Helpful Volunteer",
      skills: ["First Aid", "Cooking"],
    });

    const event = await prisma.eventDetails.create({
      data: {
        name: `Match Test Event ${makeId("event")}`,
        description: "Coordinate relief kits.",
        location: "Central Hub",
        skills: ["First Aid", "Logistics"],
        urgency: "high",
        eventDate: new Date(Date.now() + 86400000),
      },
    });

    const res = await request(app).get(BASE).set(admin.authHeader);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const match = res.body.find((row) => row.event.id === event.id);
    expect(match).toBeDefined();
    expect(match.score).toBeGreaterThan(0);
    expect(match.reason).toContain("skill");
  });

  it("handles database failures gracefully", async () => {
    const admin = await registerUser("admin");
    const spy = jest
      .spyOn(prisma.eventDetails, "findMany")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).get(BASE).set(admin.authHeader);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to build suggestions");

    spy.mockRestore();
  });
});

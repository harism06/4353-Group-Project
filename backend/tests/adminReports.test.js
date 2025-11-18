import request from "supertest";
import app from "../src/server.js";
import prisma from "../src/db/prisma.js";

const EVENTS_ENDPOINT = "/api/admin/reports/events";
const VOLUNTEERS_ENDPOINT = "/api/admin/reports/volunteers";
const PASSWORD = "Secret123!";
const createdEmails = new Set();

const makeId = (label) =>
  `${label}_${Date.now()}_${Math.random().toString(16).slice(2)}`
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();

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

async function createProfile(userId, overrides = {}) {
  await prisma.userProfile.create({
    data: {
      userId,
      fullName: overrides.fullName || `User ${userId.slice(0, 5)}`,
      address: overrides.address || "123 Demo St",
      city: overrides.city || "Houston",
      state: overrides.state || "TX",
      zipcode: overrides.zipcode || "77001",
      skills: overrides.skills || ["Logistics"],
      preferences: overrides.preferences || [],
      availability: overrides.availability || "Weekdays",
    },
  });
}

async function seedEvent(label = "report") {
  return prisma.eventDetails.create({
    data: {
      name: `Report Event ${makeId(label)}`,
      description: "Assist with logistics and setup.",
      location: "Central Hub",
      skills: ["Logistics"],
      urgency: "medium",
      eventDate: new Date(Date.now() + 86400000),
    },
  });
}

async function seedAssignment(eventId, volunteerId, overrides = {}) {
  return prisma.volunteerAssignment.create({
    data: {
      eventId,
      volunteerId,
      status: overrides.status || "pending",
      hours: overrides.hours ?? 2,
      assignedAt: overrides.assignedAt || new Date(),
      completedAt: overrides.completedAt || null,
    },
  });
}

describe("/api/admin/reports", () => {
  let admin;
  let volunteerA;
  let volunteerB;

  beforeAll(async () => {
    admin = await registerUser("admin");
    volunteerA = await registerUser("volunteer");
    volunteerB = await registerUser("volunteer");

    await createProfile(volunteerA.user.id, {
      fullName: "Volunteer Alpha",
      skills: ["Logistics", "Cooking"],
    });
    await createProfile(volunteerB.user.id, {
      fullName: "Volunteer Beta",
      skills: ["Teaching"],
    });
  });

  beforeEach(async () => {
    await prisma.volunteerAssignment.deleteMany();
    await prisma.eventDetails.deleteMany({
      where: { name: { startsWith: "Report Event" } },
    });
  });

  afterAll(async () => {
    await prisma.volunteerAssignment.deleteMany();
    await prisma.eventDetails.deleteMany({
      where: { name: { startsWith: "Report Event" } },
    });
    if (createdEmails.size) {
      await prisma.userCredentials.deleteMany({
        where: { email: { in: Array.from(createdEmails) } },
      });
    }
    await prisma.$disconnect();
  });

  it("rejects unauthenticated requests", async () => {
    const res = await request(app).get(EVENTS_ENDPOINT);
    expect(res.statusCode).toBe(401);
  });

  it("enforces admin role", async () => {
    const res = await request(app)
      .get(EVENTS_ENDPOINT)
      .set(volunteerA.authHeader);
    expect(res.statusCode).toBe(403);
  });

  it("returns aggregated event data in JSON", async () => {
    const event = await seedEvent();
    await seedAssignment(event.id, volunteerA.user.id, { status: "completed", hours: 4 });
    await seedAssignment(event.id, volunteerB.user.id, { status: "pending", hours: 2 });

    const res = await request(app)
      .get(`${EVENTS_ENDPOINT}?format=json`)
      .set(admin.authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.totalEvents).toBe(1);
    expect(res.body.summary.completedAssignments).toBe(1);
    expect(res.body.events[0].pendingAssignments).toBe(1);
  });

  it("supports CSV downloads for events", async () => {
    const event = await seedEvent();
    await seedAssignment(event.id, volunteerA.user.id, { status: "completed", hours: 3 });

    const res = await request(app)
      .get(`${EVENTS_ENDPOINT}.csv`)
      .set(admin.authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("events_report.csv");
  });

  it("returns volunteer participation data with skill filtering", async () => {
    const event = await seedEvent();
    await seedAssignment(event.id, volunteerA.user.id, { status: "completed", hours: 5 });
    await seedAssignment(event.id, volunteerB.user.id, { status: "pending", hours: 2 });

    const res = await request(app)
      .get(`${VOLUNTEERS_ENDPOINT}?format=json&skills=logistics`)
      .set(admin.authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body.volunteers.length).toBe(1);
    expect(res.body.volunteers[0].totalHours).toBe(5);
    expect(res.body.summary.totalVolunteers).toBe(1);
  });

  it("supports PDF downloads for volunteers", async () => {
    const event = await seedEvent();
    await seedAssignment(event.id, volunteerA.user.id, { status: "completed", hours: 1 });

    const res = await request(app)
      .get(`${VOLUNTEERS_ENDPOINT}.pdf`)
      .set(admin.authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("volunteers_report.pdf");
  });
});

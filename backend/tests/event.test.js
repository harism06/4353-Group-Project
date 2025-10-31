import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/server.js";
import prisma from "../src/db/prisma.js";

const BASE = "/api/events";
const PASSWORD = "Secret123!";
const createdEmails = new Set();

const makeSlug = (label) =>
  `${label}_${Date.now()}_${Math.random().toString(16).slice(2)}`
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();
const makeId = (label) => makeSlug(`events_${label}`).slice(0, 28);

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

function makePayload(overrides = {}) {
  return {
    name: `Test Event ${makeId("name")}`,
    description: "This is a sample event description used for testing.",
    location: "Houston",
    requiredSkills: ["Administration", "Organization"],
    urgency: "medium",
    eventDate: new Date(Date.now() + 86400000).toISOString(),
    ...overrides,
  };
}

beforeEach(async () => {
  await prisma.eventDetails.deleteMany({
    where: { name: { startsWith: "Test Event" } },
  });
});

afterAll(async () => {
  await prisma.eventDetails.deleteMany({
    where: { name: { startsWith: "Test Event" } },
  });
  if (createdEmails.size) {
    await prisma.userCredentials.deleteMany({
      where: { email: { in: Array.from(createdEmails) } },
    });
  }
  await prisma.$disconnect();
});

describe("/api/events", () => {
  let admin;
  let volunteer;

  beforeAll(async () => {
    admin = await registerUser("admin");
    volunteer = await registerUser("volunteer");
  });

  test("admin can create an event", async () => {
    const payload = makePayload();
    const res = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      name: payload.name,
      location: payload.location,
      requiredSkills: payload.requiredSkills,
      urgency: payload.urgency,
    });
  });

  test("rejects invalid payloads", async () => {
    const payload = makePayload({ name: "x", requiredSkills: [] });
    const res = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(payload);
    expect(res.statusCode).toBe(400);
  });

  test("requires authentication for creating events", async () => {
    const res = await request(app).post(BASE).send(makePayload());
    expect(res.statusCode).toBe(401);
  });

  test("non-admin cannot create events", async () => {
    const res = await request(app)
      .post(BASE)
      .set(volunteer.authHeader)
      .send(makePayload());
    expect(res.statusCode).toBe(403);
  });

  test("lists events and returns details", async () => {
    const payload = makePayload();
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(payload);

    const list = await request(app).get(BASE);
    expect(list.statusCode).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);

    const detail = await request(app).get(`${BASE}/${created.id}`);
    expect(detail.statusCode).toBe(200);
    expect(detail.body).toMatchObject({
      id: created.id,
      name: payload.name,
    });
  });

  test("returns 400 when fetching with blank id", async () => {
    const res = await request(app).get(`${BASE}/%20`);
    expect(res.statusCode).toBe(400);
  });

  test("updates an event", async () => {
    const payload = makePayload();
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(payload);

    const updated = await request(app)
      .put(`${BASE}/${created.id}`)
      .set(admin.authHeader)
      .send({
        ...payload,
        name: "Updated Event Title",
        urgency: "high",
      });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.name).toBe("Updated Event Title");
    expect(updated.body.urgency).toBe("high");
  });

  test("deletes an event", async () => {
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(makePayload());

    const del = await request(app)
      .delete(`${BASE}/${created.id}`)
      .set(admin.authHeader);
    expect(del.statusCode).toBe(204);

    const detail = await request(app).get(`${BASE}/${created.id}`);
    expect(detail.statusCode).toBe(404);
  });

  test("provides volunteer matches", async () => {
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(
        makePayload({
          requiredSkills: ["Administration"],
          location: "Houston",
        })
      );

    const matches = await request(app)
      .get(`${BASE}/${created.id}/matches`)
      .set(admin.authHeader);
    expect(matches.statusCode).toBe(200);
    expect(Array.isArray(matches.body)).toBe(true);
    if (matches.body.length) {
      expect(matches.body[0]).toHaveProperty("volunteerId");
      expect(matches.body[0]).toHaveProperty("score");
    }
  });

  test("normalizes stored non-array skills when listing events", async () => {
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(makePayload());

    await prisma.eventDetails.update({
      where: { id: created.id },
      data: { skills: "not-an-array" },
    });

    const list = await request(app).get(BASE);
    const target = list.body.find((evt) => evt.id === created.id);
    expect(target.requiredSkills).toEqual([]);
  });

  test("matches endpoint returns empty list when no skills overlap", async () => {
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(
        makePayload({
          requiredSkills: ["NonExistentSkill"],
          location: "Nowhere",
        })
      );

    const matches = await request(app)
      .get(`${BASE}/${created.id}/matches`)
      .set(admin.authHeader);
    expect(matches.body).toEqual([]);
  });

  test("matches endpoint includes reason when location differs", async () => {
    const { body: created } = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(
        makePayload({
          requiredSkills: ["Administration"],
          location: "Austin",
        })
      );
    const matches = await request(app)
      .get(`${BASE}/${created.id}/matches`)
      .set(admin.authHeader);

    if (matches.body.length) {
      expect(matches.body[0].reason).toContain("skill(s)");
    }
  });

  test("gracefully handles list failures", async () => {
    const spy = jest
      .spyOn(prisma.eventDetails, "findMany")
      .mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get(BASE);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to load events");
    spy.mockRestore();
  });

  test("returns 500 when fetching a single event fails", async () => {
    const spy = jest
      .spyOn(prisma.eventDetails, "findUnique")
      .mockRejectedValueOnce(new Error("db down"));
    const res = await request(app).get(`${BASE}/fake-id`);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to load event");
    spy.mockRestore();
  });

  test("returns 500 when create fails", async () => {
    const spy = jest
      .spyOn(prisma.eventDetails, "create")
      .mockRejectedValueOnce(new Error("db down"));
    const res = await request(app)
      .post(BASE)
      .set(admin.authHeader)
      .send(makePayload());
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to create event");
    spy.mockRestore();
  });

  test("returns 404 when updating missing event", async () => {
    const res = await request(app)
      .put(`${BASE}/missing-id`)
      .set(admin.authHeader)
      .send(makePayload());
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Event not found");
  });

  test("returns 400 when updating with blank id", async () => {
    const res = await request(app)
      .put(`${BASE}/%20`)
      .set(admin.authHeader)
      .send(makePayload());
    expect(res.statusCode).toBe(400);
  });

  test("returns 500 when update throws unexpected error", async () => {
    const spy = jest
      .spyOn(prisma.eventDetails, "update")
      .mockRejectedValueOnce(new Error("db down"));
    const res = await request(app)
      .put(`${BASE}/some-id`)
      .set(admin.authHeader)
      .send(makePayload());
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to update event");
    spy.mockRestore();
  });

  test("returns 404 when deleting missing event", async () => {
    const res = await request(app)
      .delete(`${BASE}/missing-id`)
      .set(admin.authHeader);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Event not found");
  });

  test("returns 400 when deleting with blank id", async () => {
    const res = await request(app)
      .delete(`${BASE}/%20`)
      .set(admin.authHeader);
    expect(res.statusCode).toBe(400);
  });

  test("returns 500 when delete throws unexpected error", async () => {
    const spy = jest
      .spyOn(prisma.eventDetails, "delete")
      .mockRejectedValueOnce(new Error("db down"));
    const res = await request(app)
      .delete(`${BASE}/some-id`)
      .set(admin.authHeader);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to delete event");
    spy.mockRestore();
  });

  test("returns 404 when requesting matches for missing event", async () => {
    const res = await request(app)
      .get(`${BASE}/missing-id/matches`)
      .set(admin.authHeader);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Event not found");
  });

  test("returns 400 when requesting matches with blank id", async () => {
    const res = await request(app)
      .get(`${BASE}/%20/matches`)
      .set(admin.authHeader);
    expect(res.statusCode).toBe(400);
  });

  test("returns 500 when matches lookup fails", async () => {
    const spy = jest
      .spyOn(prisma.eventDetails, "findUnique")
      .mockRejectedValueOnce(new Error("db down"));
    const res = await request(app)
      .get(`${BASE}/fake-id/matches`)
      .set(admin.authHeader);
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to generate matches");
    spy.mockRestore();
  });
});

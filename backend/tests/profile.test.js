import request from "supertest";
import { jest } from "@jest/globals";
import app from "../src/server.js";
import prisma from "../src/db/prisma.js";

const BASE_PROFILES = "/api/profiles";
const BASE_USERS = "/api/users";
const PASSWORD = "Secret123!";
const createdEmails = new Set();

const makeSlug = (label) =>
  `${label}_${Date.now()}_${Math.random().toString(16).slice(2)}`
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();

const makeId = (label) => makeSlug(`profile_${label}`).slice(0, 28);

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
    cookie: res.headers["set-cookie"]?.find((c) => c.startsWith("token=")),
  };
}

function makeProfilePayload(overrides = {}) {
  return {
    fullName: "John Doe",
    address: "123 Main St",
    city: "Houston",
    state: "TX",
    zipcode: "77001",
    skills: ["Event Planning", "Marketing"],
    preferences: ["morning", "weekends"],
    availability: "2025-11-01,2025-11-02",
    ...overrides,
  };
}

beforeEach(async () => {
  // Clean up BOTH profiles AND users before each test
  await prisma.userProfile.deleteMany({
    where: {
      user: {
        email: { contains: "profile_" },
      },
    },
  });
  await prisma.userCredentials.deleteMany({
    where: { email: { contains: "profile_" } },
  });
  createdEmails.clear();
});

afterAll(async () => {
  // Clean up all test data
  await prisma.userProfile.deleteMany({
    where: {
      user: {
        email: { contains: "profile_" },
      },
    },
  });
  if (createdEmails.size) {
    await prisma.userCredentials.deleteMany({
      where: { email: { in: Array.from(createdEmails) } },
    });
  }
  await prisma.$disconnect();
});

describe("GET /api/profiles/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get(`${BASE_PROFILES}/me`);
    expect(res.statusCode).toBe(401);
  });

  it("returns null when user has no profile", async () => {
    const { authHeader } = await registerUser();
    const res = await request(app).get(`${BASE_PROFILES}/me`).set(authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeNull();
  });

  it("returns user profile when it exists", async () => {
    const { authHeader, user } = await registerUser();

    // Create profile
    const payload = makeProfilePayload();
    await request(app).post(BASE_PROFILES).set(authHeader).send(payload);

    // Get profile
    const res = await request(app).get(`${BASE_PROFILES}/me`).set(authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      fullName: payload.fullName,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zipcode: payload.zipcode,
      skills: payload.skills,
      availability: payload.availability,
    });
    expect(res.body.userId).toBe(user.id);
  });

  it("handles database errors gracefully", async () => {
    const { authHeader } = await registerUser();
    const spy = jest
      .spyOn(prisma.userProfile, "findUnique")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).get(`${BASE_PROFILES}/me`).set(authHeader);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to load profile");
    spy.mockRestore();
  });
});

describe("POST /api/profiles", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .post(BASE_PROFILES)
      .send(makeProfilePayload());
    expect(res.statusCode).toBe(401);
  });

  it("creates a new profile with valid data", async () => {
    const { authHeader, user } = await registerUser();
    const payload = makeProfilePayload();

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      userId: user.id,
      fullName: payload.fullName,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      zipcode: payload.zipcode,
      skills: payload.skills,
      availability: payload.availability,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  it("updates existing profile", async () => {
    const { authHeader } = await registerUser();
    const initialPayload = makeProfilePayload();

    // Create initial profile
    await request(app).post(BASE_PROFILES).set(authHeader).send(initialPayload);

    // Update profile
    const updatedPayload = makeProfilePayload({
      fullName: "Jane Smith",
      city: "Austin",
    });

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(updatedPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body.fullName).toBe("Jane Smith");
    expect(res.body.city).toBe("Austin");
  });

  it("rejects invalid payloads - missing required fields", async () => {
    const { authHeader } = await registerUser();
    const invalidPayload = {
      fullName: "",
      address: "123 Main",
      city: "Houston",
    };

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(invalidPayload);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("fieldErrors");
  });

  it("rejects invalid state code", async () => {
    const { authHeader } = await registerUser();
    const payload = makeProfilePayload({ state: "TEXAS" });

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.fieldErrors).toHaveProperty("state");
  });

  it("rejects invalid zipcode format", async () => {
    const { authHeader } = await registerUser();
    const payload = makeProfilePayload({ zipcode: "1234" });

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.fieldErrors).toHaveProperty("zipcode");
  });

  it("rejects empty skills array", async () => {
    const { authHeader } = await registerUser();
    const payload = makeProfilePayload({ skills: [] });

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.fieldErrors).toHaveProperty("skills");
  });

  it("accepts valid extended zipcode format", async () => {
    const { authHeader } = await registerUser();
    const payload = makeProfilePayload({ zipcode: "77001-1234" });

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.zipcode).toBe("77001-1234");
  });

  it("handles database errors during creation", async () => {
    const { authHeader } = await registerUser();
    const spy = jest
      .spyOn(prisma.userProfile, "create")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(makeProfilePayload());

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to save profile");
    spy.mockRestore();
  });

  it("handles database errors during update", async () => {
    const { authHeader } = await registerUser();

    // Create profile first
    await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(makeProfilePayload());

    const spy = jest
      .spyOn(prisma.userProfile, "update")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(makeProfilePayload({ fullName: "Updated Name" }));

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to save profile");
    spy.mockRestore();
  });
});

describe("GET /api/users/:id (legacy)", () => {
  it("requires authentication", async () => {
    const res = await request(app).get(`${BASE_USERS}/some-id`);
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for blank user ID", async () => {
    const { authHeader } = await registerUser();
    const res = await request(app).get(`${BASE_USERS}/%20`).set(authHeader);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid user ID");
  });

  it("returns 404 when profile does not exist", async () => {
    const { authHeader } = await registerUser();
    const res = await request(app)
      .get(`${BASE_USERS}/non-existent-id`)
      .set(authHeader);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Profile not found");
  });

  it("returns profile for valid user ID", async () => {
    const { authHeader, user } = await registerUser();
    const payload = makeProfilePayload();

    // Create profile
    await request(app).post(BASE_PROFILES).set(authHeader).send(payload);

    // Get profile by user ID
    const res = await request(app)
      .get(`${BASE_USERS}/${user.id}`)
      .set(authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      userId: user.id,
      fullName: payload.fullName,
      address: payload.address,
    });
  });

  it("handles database errors gracefully", async () => {
    const { authHeader } = await registerUser();
    const spy = jest
      .spyOn(prisma.userProfile, "findUnique")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).get(`${BASE_USERS}/some-id`).set(authHeader);

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to load profile");
    spy.mockRestore();
  });
});

describe("PUT /api/users/:id (legacy)", () => {
  it("requires authentication", async () => {
    const res = await request(app)
      .put(`${BASE_USERS}/some-id`)
      .send(makeProfilePayload());
    expect(res.statusCode).toBe(401);
  });

  it("returns 400 for blank user ID", async () => {
    const { authHeader } = await registerUser();
    const res = await request(app)
      .put(`${BASE_USERS}/%20`)
      .set(authHeader)
      .send(makeProfilePayload());

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid user ID");
  });

  it("returns 404 when profile does not exist", async () => {
    const { authHeader } = await registerUser();
    const res = await request(app)
      .put(`${BASE_USERS}/non-existent-id`)
      .set(authHeader)
      .send(makeProfilePayload());

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Profile not found");
  });

  it("updates existing profile successfully", async () => {
    const { authHeader, user } = await registerUser();
    const initialPayload = makeProfilePayload();

    // Create profile
    await request(app).post(BASE_PROFILES).set(authHeader).send(initialPayload);

    // Update via legacy route
    const updatedPayload = makeProfilePayload({
      fullName: "Updated User",
      city: "Dallas",
    });

    const res = await request(app)
      .put(`${BASE_USERS}/${user.id}`)
      .set(authHeader)
      .send(updatedPayload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Profile updated successfully");
    expect(res.body.user.fullName).toBe("Updated User");
    expect(res.body.user.city).toBe("Dallas");
  });

  it("rejects invalid payload during update", async () => {
    const { authHeader, user } = await registerUser();

    // Create profile first
    await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(makeProfilePayload());

    // Try to update with invalid data
    const invalidPayload = makeProfilePayload({
      zipcode: "invalid",
      skills: [],
    });

    const res = await request(app)
      .put(`${BASE_USERS}/${user.id}`)
      .set(authHeader)
      .send(invalidPayload);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Validation failed");
    expect(res.body).toHaveProperty("errors");
  });

  it("handles Prisma P2025 error (not found)", async () => {
    const { authHeader, user } = await registerUser();

    // Create profile
    await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(makeProfilePayload());

    const spy = jest
      .spyOn(prisma.userProfile, "update")
      .mockRejectedValueOnce({ code: "P2025" });

    const res = await request(app)
      .put(`${BASE_USERS}/${user.id}`)
      .set(authHeader)
      .send(makeProfilePayload());

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Profile not found");
    spy.mockRestore();
  });

  it("handles unexpected database errors", async () => {
    const { authHeader, user } = await registerUser();

    // Create profile
    await request(app)
      .post(BASE_PROFILES)
      .set(authHeader)
      .send(makeProfilePayload());

    const spy = jest
      .spyOn(prisma.userProfile, "update")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app)
      .put(`${BASE_USERS}/${user.id}`)
      .set(authHeader)
      .send(makeProfilePayload());

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to update profile");
    spy.mockRestore();
  });
});

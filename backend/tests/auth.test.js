import request from "supertest";
import bcrypt from "bcrypt";
import { jest } from "@jest/globals";
import app from "../src/server.js";
import prisma from "../src/db/prisma.js";
import { signToken } from "../src/middleware/auth.js";

const BASE = "/api/auth";
const VALID_PASSWORD = "Secret123!";

const makeSlug = (label) =>
  `${label}_${Date.now()}_${Math.random().toString(16).slice(2)}`
    .replace(/[^a-z0-9_]/gi, "")
    .toLowerCase();
const makeUsername = (label) => makeSlug(`auth_${label}`).slice(0, 28);
const makeEmail = (label) => `${makeSlug(label)}@example.com`;

const getAuthCookie = (res) =>
  res.headers["set-cookie"]?.find((cookie) => cookie.startsWith("token="));

afterAll(async () => {
  // clean up only our test records
  await prisma.userCredentials.deleteMany({
    where: {
      OR: [
        { email: { startsWith: "auth_test_" } },
        { username: { startsWith: "auth_test_" } },
      ],
    },
  });
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("rejects invalid payloads", async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      username: "bad name",
      email: "not-an-email",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("formErrors");
  });

  it("creates a new user with hashed password and sets auth cookie", async () => {
    const email = makeEmail("register");
    const username = makeUsername("register");
    const res = await request(app).post(`${BASE}/register`).send({
      username,
      email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toMatchObject({
      email,
      username,
      role: "volunteer",
    });
    expect(typeof res.body.token).toBe("string");
    expect(getAuthCookie(res)).toBeDefined();

    const stored = await prisma.userCredentials.findUnique({
      where: { email },
    });
    expect(stored).not.toBeNull();
    expect(stored.password).not.toBe(VALID_PASSWORD);
    expect(stored?.username).toBe(username);
  });

  it("returns conflict for duplicate emails", async () => {
    const email = makeEmail("duplicate");
    const username = makeUsername("duplicate");
    await request(app)
      .post(`${BASE}/register`)
      .send({ username, email, password: VALID_PASSWORD });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: makeUsername("duplicate_alt"),
        email,
        password: VALID_PASSWORD,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error", "Email already used");
  });

  it("returns conflict for duplicate usernames", async () => {
    const email = makeEmail("dup_username");
    const username = makeUsername("dup_username");
    await request(app)
      .post(`${BASE}/register`)
      .send({ username, email, password: VALID_PASSWORD });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username,
        email: makeEmail("dup_username_alt"),
        password: VALID_PASSWORD,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error", "Username already used");
  });

  it("handles unexpected persistence errors gracefully", async () => {
    const email = makeEmail("error");
    const username = makeUsername("error");
    const findSpy = jest
      .spyOn(prisma.userCredentials, "findFirst")
      .mockResolvedValueOnce(null);
    const createSpy = jest
      .spyOn(prisma.userCredentials, "create")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).post(`${BASE}/register`).send({
      username,
      email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to register user");

    findSpy.mockRestore();
    createSpy.mockRestore();
  });
});

describe("POST /auth/login", () => {
  const email = makeEmail("login");
  const username = makeUsername("login");

  beforeAll(async () => {
    const hash = await bcrypt.hash(VALID_PASSWORD, 10);
    await prisma.userCredentials.create({
      data: { username, email, password: hash, role: "volunteer" },
    });
  });

  afterAll(async () => {
    await prisma.userCredentials.deleteMany({ where: { email } });
  });

  it("returns token and cookie with valid credentials", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      identifier: email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({
      email,
      username,
      role: "volunteer",
    });
    expect(typeof res.body.token).toBe("string");
    expect(getAuthCookie(res)).toBeDefined();
  });

  it("allows logging in via username", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      identifier: username,
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({ email, username });
  });

  it("rejects unknown users", async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({
        identifier: makeEmail("unknown"),
        password: VALID_PASSWORD,
      });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it("rejects invalid passwords", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      identifier: email,
      password: "not-correct",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it("validates payload shape", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      identifier: "",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("formErrors");
  });

  it("surfaces unexpected database errors as 500", async () => {
    const spy = jest
      .spyOn(prisma.userCredentials, "findFirst")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).post(`${BASE}/login`).send({
      identifier: email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to login");

    spy.mockRestore();
  });
});

describe("GET /auth/me", () => {
  it("requires authentication", async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.statusCode).toBe(401);
  });

  it("returns the authenticated user", async () => {
    const email = makeEmail("me");
    const username = makeUsername("me");
    const register = await request(app).post(`${BASE}/register`).send({
      username,
      email,
      password: VALID_PASSWORD,
    });

    const cookie = getAuthCookie(register);
    const res = await request(app).get(`${BASE}/me`).set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ role: "volunteer", email, username });
    expect(typeof res.body.id).toBe("string");
  });

  // Extra branch coverage: authenticated but user not found (404)
  it("returns 404 if token is valid but user record is missing", async () => {
    const token = signToken({ id: "non-existent-id", role: "volunteer" });
    const res = await request(app)
      .get(`${BASE}/me`)
      .set("Cookie", `token=${token}`);
    // Your handler returns 404 for not found
    expect(res.statusCode).toBe(404);
  });
});

describe("POST /auth/logout", () => {
  it("requires authentication", async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.statusCode).toBe(401);
  });

  it("clears auth cookie when authenticated", async () => {
    const email = makeEmail("logout");
    const username = makeUsername("logout");
    const register = await request(app).post(`${BASE}/register`).send({
      username,
      email,
      password: VALID_PASSWORD,
    });
    const cookie = getAuthCookie(register);

    const res = await request(app).post(`${BASE}/logout`).set("Cookie", cookie);

    expect(res.statusCode).toBe(204);
    const cleared = res.headers["set-cookie"]?.find((c) =>
      c.startsWith("token=")
    );
    expect(cleared).toBeDefined();
    expect(cleared).toContain("Expires=");
  });
});

/* ---------- EXTRA BRANCH COVERAGE FOR auth.js ---------- */

describe("Prisma unique constraint branches", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles Prisma P2002 for email on register", async () => {
    const email = makeEmail("p2002_email");
    const username = makeUsername("p2002_email");

    // Ensure findFirst -> null, then create throws P2002 for email
    jest.spyOn(prisma.userCredentials, "findFirst").mockResolvedValueOnce(null);
    jest
      .spyOn(prisma.userCredentials, "create")
      .mockRejectedValueOnce({ code: "P2002", meta: { target: ["email"] } });

    const res = await request(app).post(`${BASE}/register`).send({
      username,
      email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Email already used");
  });

  it("handles Prisma P2002 for username on register", async () => {
    const email = makeEmail("p2002_username");
    const username = makeUsername("p2002_username");

    jest.spyOn(prisma.userCredentials, "findFirst").mockResolvedValueOnce(null);
    jest
      .spyOn(prisma.userCredentials, "create")
      .mockRejectedValueOnce({ code: "P2002", meta: { target: ["username"] } });

    const res = await request(app).post(`${BASE}/register`).send({
      username,
      email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe("Username already used");
  });
});

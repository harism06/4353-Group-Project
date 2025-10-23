import request from "supertest";
import bcrypt from "bcrypt";
import { jest } from "@jest/globals";
import app from "../src/server.js";
import prisma from "../src/db/prisma.js";

const BASE = "/api/auth";
const VALID_PASSWORD = "Secret123!";

const makeEmail = (label) =>
  `auth_test_${label}_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`;

const getAuthCookie = (res) =>
  res.headers["set-cookie"]?.find((cookie) => cookie.startsWith("token="));

afterAll(async () => {
  await prisma.userCredentials.deleteMany({
    where: { email: { startsWith: "auth_test_" } },
  });
  await prisma.$disconnect();
});

describe("POST /auth/register", () => {
  it("rejects invalid payloads", async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      email: "not-an-email",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("formErrors");
  });

  it("creates a new user with hashed password and sets auth cookie", async () => {
    const email = makeEmail("register");
    const res = await request(app).post(`${BASE}/register`).send({
      email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toMatchObject({ email, role: "volunteer" });
    expect(typeof res.body.token).toBe("string");
    expect(getAuthCookie(res)).toBeDefined();

    const stored = await prisma.userCredentials.findUnique({ where: { email } });
    expect(stored).not.toBeNull();
    expect(stored.password).not.toBe(VALID_PASSWORD);
  });

  it("returns conflict for duplicate emails", async () => {
    const email = makeEmail("duplicate");
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: VALID_PASSWORD });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email, password: VALID_PASSWORD });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error", "Email already used");
  });

  it("handles unexpected persistence errors gracefully", async () => {
    const email = makeEmail("error");
    const findSpy = jest
      .spyOn(prisma.userCredentials, "findUnique")
      .mockResolvedValueOnce(null);
    const createSpy = jest
      .spyOn(prisma.userCredentials, "create")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).post(`${BASE}/register`).send({
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

  beforeAll(async () => {
    const hash = await bcrypt.hash(VALID_PASSWORD, 10);
    await prisma.userCredentials.create({
      data: { email, password: hash, role: "volunteer" },
    });
  });

  afterAll(async () => {
    await prisma.userCredentials.deleteMany({ where: { email } });
  });

  it("returns token and cookie with valid credentials", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email,
      password: VALID_PASSWORD,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toMatchObject({ email, role: "volunteer" });
    expect(typeof res.body.token).toBe("string");
    expect(getAuthCookie(res)).toBeDefined();
  });

  it("rejects unknown users", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: makeEmail("unknown"),
      password: VALID_PASSWORD,
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it("rejects invalid passwords", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email,
      password: "not-correct",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials");
  });

  it("validates payload shape", async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: "bad-email",
      password: "123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("formErrors");
  });

  it("surfaces unexpected database errors as 500", async () => {
    const spy = jest
      .spyOn(prisma.userCredentials, "findUnique")
      .mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).post(`${BASE}/login`).send({
      email,
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
    const register = await request(app).post(`${BASE}/register`).send({
      email,
      password: VALID_PASSWORD,
    });

    const cookie = getAuthCookie(register);
    const res = await request(app)
      .get(`${BASE}/me`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ role: "volunteer" });
    expect(typeof res.body.id).toBe("string");
  });
});

describe("POST /auth/logout", () => {
  it("requires authentication", async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.statusCode).toBe(401);
  });

  it("clears auth cookie when authenticated", async () => {
    const email = makeEmail("logout");
    const register = await request(app).post(`${BASE}/register`).send({
      email,
      password: VALID_PASSWORD,
    });
    const cookie = getAuthCookie(register);

    const res = await request(app)
      .post(`${BASE}/logout`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(204);
    const cleared = res.headers["set-cookie"]?.find((c) =>
      c.startsWith("token=")
    );
    expect(cleared).toBeDefined();
    expect(cleared).toContain("Expires=");
  });
});

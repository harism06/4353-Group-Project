const request = require("supertest");
const app = require("../server");

const genEmail = () => `azamat_${Date.now()}@example.com`;
const validPassword = "secret123";

describe("Auth Routes (/api/auth)", () => {
  let email;

  beforeAll(() => {
    email = genEmail(); // unique per run to avoid flakiness
  });

  test("rejects invalid registration payload (bad email + short password)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bad", password: "123" });
    expect(res.status).toBe(400);
  });

  test("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: validPassword });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe(email);
  });

  test("blocks duplicate registration for same email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: validPassword });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "User already exists");
  });

  test("logs in successfully with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: validPassword });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body).toHaveProperty("user");
  });

  test("fails login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  test("rejects invalid login payload (bad email + short password)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad", password: "123" });
    expect(res.status).toBe(400);
  });
});

const request = require("supertest");
const app = require("../server");

describe("Event API Tests", () => {
  test("GET /api/events should return all events", async () => {
    const res = await request(app).get("/api/events");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/events should create a new event", async () => {
    const newEvent = {
      name: "Park Cleaning",
      requiredSkills: ["Organization"],
      urgency: "Medium",
      location: "Houston",
    };

    const res = await request(app)
      .post("/api/events")
      .send(newEvent)
      .set("Accept", "application/json");

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Park Cleaning");
  });

  test("POST /api/events should fail with invalid data", async () => {
    const badEvent = { name: "X" }; // Missing required fields
    const res = await request(app)
      .post("/api/events")
      .send(badEvent)
      .set("Accept", "application/json");
    expect(res.statusCode).toBe(400);
  });
});

const request = require("supertest");
const app = require("../server");

describe("Volunteer Matching Tests", () => {
  test("GET /api/match/1 should return matching volunteers", async () => {
    const res = await request(app).get("/api/match/1");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/match/999 should return 404 for invalid event", async () => {
    const res = await request(app).get("/api/match/999");
    expect(res.statusCode).toBe(404);
  });
});

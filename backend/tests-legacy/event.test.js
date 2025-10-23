const request = require("supertest");
const app = require("../server");
const { events } = require("../data/events");
const { eventSchema } = require("../validations/eventSchema");

/**
 * @file Event API tests.
 * @module backend/tests/event.test
 */

describe("Event API Tests", () => {
  // Clear events array before each test to ensure test isolation
  beforeEach(() => {
    events.length = 0;
    jest.restoreAllMocks();
  });

  describe("GET /api/events", () => {
    test("should return all events", async () => {
      const res = await request(app).get("/api/events");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test("should return empty array when no events exist", async () => {
      const res = await request(app).get("/api/events");
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/events", () => {
    test("should create a new event with all required fields", async () => {
      const newEvent = {
        name: "Park Cleaning",
        description: "Clean up the local park",
        requiredSkills: ["Organization"],
        urgency: "Medium",
        location: "Houston",
        date: "2024-12-31",
      };

      const res = await request(app)
        .post("/api/events")
        .send(newEvent)
        .set("Accept", "application/json");

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("id");
      expect(res.body.name).toBe("Park Cleaning");
      expect(res.body.description).toBe("Clean up the local park");
      expect(res.body.location).toBe("Houston");
      expect(res.body.urgency).toBe("Medium");
      expect(res.body.date).toBe("2024-12-31");
      expect(events).toHaveLength(1);
    });

    test("should return 400 if name is too short", async () => {
      const badEvent = { 
        name: "X",
        description: "Valid description",
        location: "Houston",
        requiredSkills: ["Organization"],
        urgency: "Medium",
        date: "2024-12-31"
      };
      
      const res = await request(app)
        .post("/api/events")
        .send(badEvent)
        .set("Accept", "application/json");
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(events).toHaveLength(0);
    });

    test("should return 400 if description is missing", async () => {
      const badEvent = { 
        name: "Park Cleaning",
        location: "Houston",
        requiredSkills: ["Organization"],
        urgency: "Medium",
        date: "2024-12-31"
      };
      
      const res = await request(app)
        .post("/api/events")
        .send(badEvent)
        .set("Accept", "application/json");
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(events).toHaveLength(0);
    });

    test("should return 400 if location is missing", async () => {
      const badEvent = { 
        name: "Park Cleaning",
        description: "Clean up the park",
        requiredSkills: ["Organization"],
        urgency: "Medium",
        date: "2024-12-31"
      };
      
      const res = await request(app)
        .post("/api/events")
        .send(badEvent)
        .set("Accept", "application/json");
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(events).toHaveLength(0);
    });

    test("should return 400 if requiredSkills is empty", async () => {
      const badEvent = { 
        name: "Park Cleaning",
        description: "Clean up the park",
        location: "Houston",
        requiredSkills: [],
        urgency: "Medium",
        date: "2024-12-31"
      };
      
      const res = await request(app)
        .post("/api/events")
        .send(badEvent)
        .set("Accept", "application/json");
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(events).toHaveLength(0);
    });

    test("should return 400 if urgency is invalid", async () => {
      const badEvent = { 
        name: "Park Cleaning",
        description: "Clean up the park",
        location: "Houston",
        requiredSkills: ["Organization"],
        urgency: "Invalid",
        date: "2024-12-31"
      };
      
      const res = await request(app)
        .post("/api/events")
        .send(badEvent)
        .set("Accept", "application/json");
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(events).toHaveLength(0);
    });

    test("should return 400 if date is missing", async () => {
      const badEvent = { 
        name: "Park Cleaning",
        description: "Clean up the park",
        location: "Houston",
        requiredSkills: ["Organization"],
        urgency: "Medium"
      };
      
      const res = await request(app)
        .post("/api/events")
        .send(badEvent)
        .set("Accept", "application/json");
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(events).toHaveLength(0);
    });
  });
});

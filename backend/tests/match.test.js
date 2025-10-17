const request = require("supertest");
const app = require("../server");
const { events } = require("../data/events");
const users = require("../data/users");

/**
 * @file Volunteer matching API tests.
 * @module backend/tests/match.test
 */

describe("Volunteer Matching Tests", () => {
  // Setup test data before each test
  beforeEach(() => {
    // Clear and setup events
    events.length = 0;
    events.push(
      {
        id: 1,
        name: "Park Cleanup",
        description: "Clean up the local park",
        location: "Houston",
        requiredSkills: ["Teamwork", "Organization"],
        urgency: "Medium",
        date: "2024-12-31",
      },
      {
        id: 2,
        name: "Food Drive",
        description: "Organize a food drive",
        location: "Austin",
        requiredSkills: ["Communication", "Leadership"],
        urgency: "High",
        date: "2024-11-15",
      }
    );

    // Clear and setup users
    users.length = 0;
    users.push(
      {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
        skills: ["Teamwork", "Organization", "Communication"],
      },
      {
        id: "user2",
        name: "Jane Smith",
        email: "jane@example.com",
        skills: ["Leadership", "Communication"],
      },
      {
        id: "user3",
        name: "Bob Johnson",
        email: "bob@example.com",
        skills: ["Cooking", "Cleaning"],
      }
    );
  });

  // Clean up after each test
  afterEach(() => {
    events.length = 0;
    users.length = 0;
  });

  describe("GET /api/match/:eventId", () => {
    test("should return matching volunteers for event 1", async () => {
      const res = await request(app).get("/api/match/1");
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // John should match with 2 skills (Teamwork, Organization)
      const johnMatch = res.body.find(u => u.id === "user1");
      expect(johnMatch).toBeDefined();
      expect(johnMatch.matchScore).toBe(2);
      
      // Results should be sorted by matchScore descending
      for (let i = 0; i < res.body.length - 1; i++) {
        expect(res.body[i].matchScore).toBeGreaterThanOrEqual(res.body[i + 1].matchScore);
      }
    });

    test("should return matching volunteers for event 2", async () => {
      const res = await request(app).get("/api/match/2");
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      
      // Both John and Jane should match
      expect(res.body).toHaveLength(2);
      
      // Jane should have higher score (2 skills: Communication, Leadership)
      expect(res.body[0].id).toBe("user2");
      expect(res.body[0].matchScore).toBe(2);
      
      // John should have lower score (1 skill: Communication)
      expect(res.body[1].id).toBe("user1");
      expect(res.body[1].matchScore).toBe(1);
    });

    test("should return empty array when no volunteers match", async () => {
      // Add event with skills that no user has
      events.push({
        id: 3,
        name: "Tech Workshop",
        description: "Teach coding",
        location: "Dallas",
        requiredSkills: ["Programming", "Teaching"],
        urgency: "Low",
        date: "2024-10-01",
      });

      const res = await request(app).get("/api/match/3");
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    test("should return 404 for non-existent event", async () => {
      const res = await request(app).get("/api/match/999");
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Event not found");
    });

    test("should filter out volunteers with no matching skills", async () => {
      const res = await request(app).get("/api/match/1");
      
      expect(res.statusCode).toBe(200);
      // Bob (user3) should not be in results as he has no matching skills
      const bobMatch = res.body.find(u => u.id === "user3");
      expect(bobMatch).toBeUndefined();
    });

    test("should include matchScore for each volunteer", async () => {
      const res = await request(app).get("/api/match/1");
      
      expect(res.statusCode).toBe(200);
      res.body.forEach(volunteer => {
        expect(volunteer).toHaveProperty("matchScore");
        expect(typeof volunteer.matchScore).toBe("number");
        expect(volunteer.matchScore).toBeGreaterThan(0);
      });
    });
  });
});

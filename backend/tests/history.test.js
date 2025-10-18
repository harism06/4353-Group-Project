const request = require("supertest");
const app = require("../server");
const history = require("../data/history");
const { randomUUID } = require("crypto");
const historySchema = require("../validations/historySchema");

/**
 * @file Volunteer history API tests.
 * @module backend/tests/history.test
 */

describe("History API", () => {
  // Clear history array before each test to ensure test isolation
  beforeEach(() => {
    history.length = 0;
    jest.restoreAllMocks();
  });

  describe("POST /api/history", () => {
    test("should create a new history record successfully", async () => {
      const newHistoryRecord = {
        userId: randomUUID(),
        eventId: randomUUID(),
        activityType: "Volunteer",
        details: "Helped at the local animal shelter",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.userId).toBe(newHistoryRecord.userId);
      expect(response.body.eventId).toBe(newHistoryRecord.eventId);
      expect(response.body.activityType).toBe(newHistoryRecord.activityType);
      expect(response.body.details).toBe(newHistoryRecord.details);
      expect(response.body).toHaveProperty("timestamp");
      expect(history).toHaveLength(1);
    });

    test("should return 400 if userId is missing", async () => {
      const newHistoryRecord = {
        eventId: randomUUID(),
        activityType: "Volunteer",
        details: "Helped at the local animal shelter",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain("Required");
      expect(history).toHaveLength(0);
    });

    test("should return 400 if eventId is missing", async () => {
      const newHistoryRecord = {
        userId: randomUUID(),
        activityType: "Volunteer",
        details: "Helped at the local animal shelter",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain("Required");
      expect(history).toHaveLength(0);
    });

    test("should return 400 if activityType is missing", async () => {
      const newHistoryRecord = {
        userId: randomUUID(),
        eventId: randomUUID(),
        details: "Helped at the local animal shelter",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain("Required");
      expect(history).toHaveLength(0);
    });

    test("should return 400 if activityType is too long", async () => {
      const newHistoryRecord = {
        userId: randomUUID(),
        eventId: randomUUID(),
        activityType: "a".repeat(101),
        details: "Helped at the local animal shelter",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain(
        "Activity type cannot exceed 100 characters."
      );
      expect(history).toHaveLength(0);
    });

    test("should allow details to be optional", async () => {
      const newHistoryRecord = {
        userId: randomUUID(),
        eventId: randomUUID(),
        activityType: "Attended",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.details).toBeUndefined();
      expect(history).toHaveLength(1);
    });

    test("should return 500 if an unexpected server error occurs during creation", async () => {
      // Mock the schema parse method to throw a non-Zod error
      jest.spyOn(historySchema.createHistoryInputSchema, "parse").mockImplementationOnce(() => {
        throw new Error("Unexpected database error");
      });

      const newHistoryRecord = {
        userId: randomUUID(),
        eventId: randomUUID(),
        activityType: "Volunteer",
        details: "Test details",
      };

      const response = await request(app)
        .post("/api/history")
        .send(newHistoryRecord);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Internal server error");
      expect(history).toHaveLength(0);
    });
  });

  describe("GET /api/history/:userId", () => {
    test("should return history records for a specific user", async () => {
      const userId1 = randomUUID();
      const userId2 = randomUUID();
      const eventId1 = randomUUID();
      const eventId2 = randomUUID();

      // Add some mock history records
      history.push(
        {
          id: randomUUID(),
          userId: userId1,
          eventId: eventId1,
          activityType: "Volunteer",
          timestamp: new Date().toISOString(),
          details: "Cleaned park",
        },
        {
          id: randomUUID(),
          userId: userId1,
          eventId: eventId2,
          activityType: "Attended",
          timestamp: new Date().toISOString(),
          details: "Community meeting",
        },
        {
          id: randomUUID(),
          userId: userId2,
          eventId: randomUUID(),
          activityType: "Organized",
          timestamp: new Date().toISOString(),
          details: "Fundraiser",
        }
      );

      const response = await request(app).get(`/api/history/${userId1}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].userId).toBe(userId1);
      expect(response.body[1].userId).toBe(userId1);
    });

    test("should return an empty array if user has no history", async () => {
      const userId = randomUUID();
      const response = await request(app).get(`/api/history/${userId}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    test("should allow non-UUID userId parameters", async () => {
      const response = await request(app).get("/api/history/invalid-uuid");

      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test("should return 500 if an unexpected server error occurs during retrieval", async () => {
      const validUserId = randomUUID();
      
      // Mock the schema parse method to throw a non-Zod error
      jest.spyOn(historySchema.getHistoryByUserIdSchema, "parse").mockImplementationOnce(() => {
        throw new Error("Unexpected server error during retrieval");
      });

      const response = await request(app).get(`/api/history/${validUserId}`);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Internal server error");
    });
  });
});

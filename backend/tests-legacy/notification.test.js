const request = require("supertest");
const app = require("../server");
const notifications = require("../data/notifications");
const { randomUUID } = require("crypto");
const notificationSchema = require("../validations/notificationSchema");

/**
 * @file Notification API tests.
 * @module backend/tests/notification.test
 */

describe("Notification API", () => {
  // Clear notifications array before each test to ensure test isolation
  beforeEach(() => {
    notifications.length = 0;
    jest.restoreAllMocks();
  });

  describe("POST /api/notifications", () => {
    test("should create a new notification successfully", async () => {
      const newNotification = {
        userId: randomUUID(),
        message: "Test notification message",
        // eventId is optional
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.userId).toBe(newNotification.userId);
      expect(response.body.data.message).toBe(newNotification.message);
      expect(response.body.data).toHaveProperty("timestamp");
      expect(response.body.data.read).toBe(false);
      expect(notifications).toHaveLength(1);
    });

    test("should return 400 if userId is missing", async () => {
      const newNotification = {
        message: "Test notification message",
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain("Required");
      expect(notifications).toHaveLength(0);
    });

    test("should return 400 if message is missing", async () => {
      const newNotification = {
        userId: randomUUID(),
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain("Required");
      expect(notifications).toHaveLength(0);
    });

    test("should return 400 if message is too long", async () => {
      const newNotification = {
        userId: randomUUID(),
        message: "a".repeat(501), // Message exceeding 500 characters
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("errors");
      expect(response.body.errors[0].message).toContain(
        "Notification message cannot exceed 500 characters."
      );
      expect(notifications).toHaveLength(0);
    });

    test("should allow eventId to be optional", async () => {
      const newNotification = {
        userId: randomUUID(),
        message: "Another test notification",
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data.eventId).toBeUndefined();
      expect(notifications).toHaveLength(1);
    });

    test("should accept non-UUID event IDs when provided", async () => {
      const newNotification = {
        userId: randomUUID(),
        message: "Notification with invalid event ID",
        eventId: "invalid-uuid",
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.eventId).toBe(newNotification.eventId);
      expect(notifications).toHaveLength(1);
    });

    test("should return 500 if an unexpected server error occurs", async () => {
      // Mock the schema parse method to throw a non-Zod error
      jest.spyOn(notificationSchema.createNotificationInputSchema, "parse").mockImplementationOnce(() => {
        throw new Error("Unexpected server error");
      });

      const newNotification = {
        userId: randomUUID(),
        message: "Test notification",
      };

      const response = await request(app)
        .post("/api/notifications")
        .send(newNotification);

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Internal server error");
      expect(notifications).toHaveLength(0);
    });
  });
});

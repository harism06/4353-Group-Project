const request = require("supertest");
const app = require("../server");

describe("User Profile Management", () => {
  describe("GET /api/users/:id", () => {
    it("should return user profile for valid ID", async () => {
      const res = await request(app).get("/api/users/1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", 1);
      expect(res.body).toHaveProperty("fullName");
      expect(res.body).toHaveProperty("email");
      expect(res.body).not.toHaveProperty("password"); // Should not return password
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app).get("/api/users/999");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "User not found");
    });

    it("should return 400 for invalid user ID", async () => {
      const res = await request(app).get("/api/users/abc");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Invalid user ID");
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update user profile with valid data", async () => {
      const updateData = {
        fullName: "Alice Updated",
        address1: "999 New Street",
        address2: "Suite 100",
        city: "Austin",
        state: "TX",
        zipCode: "78701",
        skills: ["Teaching", "Fundraising"],
        preferences: "Prefer afternoon events",
        availability: ["2025-10-30", "2025-10-31"],
      };

      const res = await request(app).put("/api/users/1").send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Profile updated successfully"
      );
      expect(res.body.user).toHaveProperty("fullName", "Alice Updated");
      expect(res.body.user).toHaveProperty("city", "Austin");
      expect(res.body.user.skills).toContain("Teaching");
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should return 404 for non-existent user", async () => {
      const updateData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/999").send(updateData);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "User not found");
    });

    it("should return 400 for invalid user ID", async () => {
      const res = await request(app).put("/api/users/invalid").send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Invalid user ID");
    });

    it("should return 400 when fullName is missing", async () => {
      const invalidData = {
        address1: "123 Test St",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
      expect(res.body.errors).toBeDefined();
    });

    it("should return 400 when fullName exceeds 50 characters", async () => {
      const invalidData = {
        fullName: "A".repeat(51),
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should return 400 when address1 is missing", async () => {
      const invalidData = {
        fullName: "Test User",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should return 400 when city is missing", async () => {
      const invalidData = {
        fullName: "Test User",
        address1: "123 Test St",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should return 400 when state is missing", async () => {
      const invalidData = {
        fullName: "Test User",
        address1: "123 Test St",
        city: "Houston",
        zipCode: "77001",
        skills: ["Cooking"],
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should return 400 when zipCode format is invalid", async () => {
      const invalidData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "1234", // Invalid format
        skills: ["Cooking"],
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should accept valid zipCode with extended format", async () => {
      const validData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001-1234", // Valid extended format
        skills: ["Cooking"],
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(validData);

      expect(res.status).toBe(200);
    });

    it("should return 400 when skills array is empty", async () => {
      const invalidData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: [], // Empty skills
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should return 400 when availability array is empty", async () => {
      const invalidData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        preferences: "",
        availability: [], // Empty availability
      };

      const res = await request(app).put("/api/users/1").send(invalidData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation failed");
    });

    it("should accept optional address2 field", async () => {
      const validData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "", // Optional
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(validData);

      expect(res.status).toBe(200);
    });

    it("should accept optional preferences field", async () => {
      const validData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        preferences: "", // Optional
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(validData);

      expect(res.status).toBe(200);
    });

    it("should handle multiple skills correctly", async () => {
      const validData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking", "Teaching", "Fundraising"],
        preferences: "",
        availability: ["2025-10-20"],
      };

      const res = await request(app).put("/api/users/1").send(validData);

      expect(res.status).toBe(200);
      expect(res.body.user.skills).toHaveLength(3);
    });

    it("should handle multiple availability dates correctly", async () => {
      const validData = {
        fullName: "Test User",
        address1: "123 Test St",
        address2: "",
        city: "Houston",
        state: "TX",
        zipCode: "77001",
        skills: ["Cooking"],
        preferences: "",
        availability: ["2025-10-20", "2025-10-21", "2025-10-22"],
      };

      const res = await request(app).put("/api/users/1").send(validData);

      expect(res.status).toBe(200);
      expect(res.body.user.availability).toHaveLength(3);
    });
  });
});

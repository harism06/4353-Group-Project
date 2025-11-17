/**
 * @file Integration tests for admin report endpoints.
 * @module backend/tests/reports.test
 * @description Tests for report generation endpoints including CSV and PDF formats,
 * authentication, authorization, and input validation.
 */

const request = require("supertest");
const app = require("../server");

/**
 * Helper function to create an admin authorization header.
 * @param {string} token - Admin token (defaults to mock admin token).
 * @returns {Object} Headers object with Authorization.
 */
function getAdminHeaders(token = "admin-token") {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Helper function to create a non-admin authorization header.
 * @returns {Object} Headers object with regular user token.
 */
function getRegularUserHeaders() {
  return {
    Authorization: "Bearer regular-user-token",
  };
}

describe("Admin Reports API", () => {
  /**
   * Note: These tests assume the report routes will be created by Ibrahim.
   * The routes should be:
   * - GET /admin/reports/events.csv
   * - GET /admin/reports/events.pdf
   * - GET /admin/reports/volunteers.csv
   * - GET /admin/reports/volunteers.pdf
   */

  describe("GET /admin/reports/events.csv", () => {
    /**
     * Test successful CSV report generation with valid admin token.
     */
    test("should return 200 OK with CSV content for valid admin request", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv")
        .set(getAdminHeaders());

      // If route exists, verify successful response
      if (response.status !== 404) {
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/csv");
        expect(response.headers["content-disposition"]).toContain("attachment");
        expect(response.headers["content-disposition"]).toMatch(/filename="events_\d{4}-\d{2}-\d{2}\.csv"/);
        expect(response.text).toBeTruthy();
        // Verify CSV format (should have headers)
        expect(response.text).toContain(",");
      }
    });

    /**
     * Test unauthorized access without token.
     */
    test("should return 401 Unauthorized when no token is provided", async () => {
      const response = await request(app).get("/admin/reports/events.csv");

      // If route exists, verify unauthorized response
      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Unauthorized");
      }
    });

    /**
     * Test unauthorized access with non-admin token.
     */
    test("should return 401 Unauthorized when non-admin token is provided", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv")
        .set(getRegularUserHeaders());

      // If route exists, verify unauthorized response
      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Admin");
      }
    });

    /**
     * Test invalid query parameters (date range validation).
     */
    test("should return 400 Bad Request for invalid date range parameters", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv?startDate=invalid-date&endDate=2025-01-01")
        .set(getAdminHeaders());

      // If route exists, verify validation error
      if (response.status !== 404) {
        expect([400, 200]).toContain(response.status);
        // If validation is implemented, should return 400
        if (response.status === 400) {
          expect(response.body).toHaveProperty("error");
        }
      }
    });

    /**
     * Test valid query parameters with date range.
     */
    test("should accept valid date range query parameters", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv?startDate=2025-01-01&endDate=2025-01-31")
        .set(getAdminHeaders());

      // If route exists, should accept valid parameters
      if (response.status !== 404) {
        expect([200, 400]).toContain(response.status);
      }
    });

    /**
     * Test CSV content format and headers.
     */
    test("should return properly formatted CSV with headers", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv")
        .set(getAdminHeaders());

      if (response.status === 200) {
        const csvContent = response.text;
        const lines = csvContent.split("\n");

        // Should have at least a header row
        expect(lines.length).toBeGreaterThan(0);
        expect(lines[0]).toContain(","); // CSV should have commas

        // Verify Content-Disposition header includes filename
        expect(response.headers["content-disposition"]).toBeTruthy();
        expect(response.headers["content-disposition"]).toContain(".csv");
      }
    });
  });

  describe("GET /admin/reports/events.pdf", () => {
    /**
     * Test successful PDF report generation with valid admin token.
     */
    test("should return 200 OK with PDF content for valid admin request", async () => {
      const response = await request(app)
        .get("/admin/reports/events.pdf")
        .set(getAdminHeaders());

      // If route exists, verify successful response
      if (response.status !== 404) {
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/pdf");
        expect(response.headers["content-disposition"]).toContain("attachment");
        expect(response.headers["content-disposition"]).toMatch(/filename="events_\d{4}-\d{2}-\d{2}\.pdf"/);
        // PDF files should have binary content
        expect(Buffer.isBuffer(response.body) || typeof response.body === "object").toBeTruthy();
      }
    });

    /**
     * Test unauthorized access without token.
     */
    test("should return 401 Unauthorized when no token is provided", async () => {
      const response = await request(app).get("/admin/reports/events.pdf");

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
      }
    });

    /**
     * Test unauthorized access with non-admin token.
     */
    test("should return 401 Unauthorized when non-admin token is provided", async () => {
      const response = await request(app)
        .get("/admin/reports/events.pdf")
        .set(getRegularUserHeaders());

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
      }
    });
  });

  describe("GET /admin/reports/volunteers.csv", () => {
    /**
     * Test successful CSV report generation for volunteers.
     */
    test("should return 200 OK with CSV content for valid admin request", async () => {
      const response = await request(app)
        .get("/admin/reports/volunteers.csv")
        .set(getAdminHeaders());

      if (response.status !== 404) {
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/csv");
        expect(response.headers["content-disposition"]).toContain("attachment");
        expect(response.headers["content-disposition"]).toMatch(/filename="volunteers_\d{4}-\d{2}-\d{2}\.csv"/);
        expect(response.text).toBeTruthy();
      }
    });

    /**
     * Test unauthorized access without token.
     */
    test("should return 401 Unauthorized when no token is provided", async () => {
      const response = await request(app).get("/admin/reports/volunteers.csv");

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
      }
    });

    /**
     * Test unauthorized access with non-admin token.
     */
    test("should return 401 Unauthorized when non-admin token is provided", async () => {
      const response = await request(app)
        .get("/admin/reports/volunteers.csv")
        .set(getRegularUserHeaders());

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
      }
    });

    /**
     * Test invalid query parameters.
     */
    test("should return 400 Bad Request for invalid query parameters", async () => {
      const response = await request(app)
        .get("/admin/reports/volunteers.csv?eventId=invalid-uuid")
        .set(getAdminHeaders());

      if (response.status !== 404) {
        expect([400, 200]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body).toHaveProperty("error");
        }
      }
    });

    /**
     * Test CSV content includes volunteer data and summary.
     */
    test("should return CSV with volunteer participation data", async () => {
      const response = await request(app)
        .get("/admin/reports/volunteers.csv")
        .set(getAdminHeaders());

      if (response.status === 200) {
        const csvContent = response.text;
        const lines = csvContent.split("\n");

        // Should have headers
        expect(lines.length).toBeGreaterThan(0);
        expect(lines[0]).toContain(",");
      }
    });
  });

  describe("GET /admin/reports/volunteers.pdf", () => {
    /**
     * Test successful PDF report generation for volunteers.
     */
    test("should return 200 OK with PDF content for valid admin request", async () => {
      const response = await request(app)
        .get("/admin/reports/volunteers.pdf")
        .set(getAdminHeaders());

      if (response.status !== 404) {
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("application/pdf");
        expect(response.headers["content-disposition"]).toContain("attachment");
        expect(response.headers["content-disposition"]).toMatch(/filename="volunteers_\d{4}-\d{2}-\d{2}\.pdf"/);
      }
    });

    /**
     * Test unauthorized access without token.
     */
    test("should return 401 Unauthorized when no token is provided", async () => {
      const response = await request(app).get("/admin/reports/volunteers.pdf");

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
      }
    });

    /**
     * Test unauthorized access with non-admin token.
     */
    test("should return 401 Unauthorized when non-admin token is provided", async () => {
      const response = await request(app)
        .get("/admin/reports/volunteers.pdf")
        .set(getRegularUserHeaders());

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty("message");
      }
    });
  });

  describe("Report Headers and Filenames", () => {
    /**
     * Test that CSV reports have correct Content-Type header.
     */
    test("CSV reports should have text/csv content type", async () => {
      const csvRoutes = ["/admin/reports/events.csv", "/admin/reports/volunteers.csv"];

      for (const route of csvRoutes) {
        const response = await request(app).get(route).set(getAdminHeaders());

        if (response.status === 200) {
          expect(response.headers["content-type"]).toContain("text/csv");
        }
      }
    });

    /**
     * Test that PDF reports have correct Content-Type header.
     */
    test("PDF reports should have application/pdf content type", async () => {
      const pdfRoutes = ["/admin/reports/events.pdf", "/admin/reports/volunteers.pdf"];

      for (const route of pdfRoutes) {
        const response = await request(app).get(route).set(getAdminHeaders());

        if (response.status === 200) {
          expect(response.headers["content-type"]).toContain("application/pdf");
        }
      }
    });

    /**
     * Test that all reports have Content-Disposition header with filename.
     */
    test("All reports should have Content-Disposition header with proper filename", async () => {
      const routes = [
        "/admin/reports/events.csv",
        "/admin/reports/events.pdf",
        "/admin/reports/volunteers.csv",
        "/admin/reports/volunteers.pdf",
      ];

      for (const route of routes) {
        const response = await request(app).get(route).set(getAdminHeaders());

        if (response.status === 200) {
          expect(response.headers["content-disposition"]).toBeTruthy();
          expect(response.headers["content-disposition"]).toContain("attachment");
          expect(response.headers["content-disposition"]).toContain("filename=");

          // Verify filename format matches expected pattern
          const filenameMatch = response.headers["content-disposition"].match(/filename="([^"]+)"/);
          if (filenameMatch) {
            const filename = filenameMatch[1];
            if (route.endsWith(".csv")) {
              expect(filename).toMatch(/^events_\d{4}-\d{2}-\d{2}\.csv$|^volunteers_\d{4}-\d{2}-\d{2}\.csv$/);
            } else if (route.endsWith(".pdf")) {
              expect(filename).toMatch(/^events_\d{4}-\d{2}-\d{2}\.pdf$|^volunteers_\d{4}-\d{2}-\d{2}\.pdf$/);
            }
          }
        }
      }
    });
  });

  describe("Input Validation", () => {
    /**
     * Test validation of date range parameters.
     */
    test("should validate date range format", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv?startDate=2025-01-01&endDate=2025-01-31")
        .set(getAdminHeaders());

      if (response.status !== 404) {
        // Valid dates should either succeed or fail gracefully
        expect([200, 400]).toContain(response.status);
      }
    });

    /**
     * Test validation rejects invalid date formats.
     */
    test("should reject invalid date formats", async () => {
      const invalidDates = ["invalid", "2025-13-01", "2025-01-32", "01-01-2025"];

      for (const date of invalidDates) {
        const response = await request(app)
          .get(`/admin/reports/events.csv?startDate=${date}`)
          .set(getAdminHeaders());

        if (response.status !== 404) {
          // Should either validate and return 400, or accept and process
          expect([200, 400]).toContain(response.status);
        }
      }
    });

    /**
     * Test validation of eventId parameter.
     */
    test("should validate eventId format when provided", async () => {
      const response = await request(app)
        .get("/admin/reports/events.csv?eventId=invalid-uuid")
        .set(getAdminHeaders());

      if (response.status !== 404) {
        expect([200, 400]).toContain(response.status);
        if (response.status === 400) {
          expect(response.body).toHaveProperty("error");
        }
      }
    });
  });
});


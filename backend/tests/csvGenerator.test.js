/**
 * @file Unit tests for CSV generation utility.
 * @module backend/tests/csvGenerator.test
 * @description Comprehensive tests for CSV formatting, escaping, headers, and edge cases.
 */

const {
  escapeCSVField,
  generateCSV,
  generateCSVWithSummary,
  generateCSVFilename,
} = require("../utils/csvGenerator");

describe("CSV Generator Utility", () => {
  describe("escapeCSVField", () => {
    /**
     * Test basic string values that don't require escaping.
     */
    test("should return plain string for simple values", () => {
      expect(escapeCSVField("Hello")).toBe("Hello");
      expect(escapeCSVField("123")).toBe("123");
      expect(escapeCSVField("abc")).toBe("abc");
    });

    /**
     * Test numeric values are converted to strings.
     */
    test("should convert numbers to strings", () => {
      expect(escapeCSVField(123)).toBe("123");
      expect(escapeCSVField(0)).toBe("0");
      expect(escapeCSVField(-42)).toBe("-42");
      expect(escapeCSVField(3.14)).toBe("3.14");
    });

    /**
     * Test boolean values are converted to strings.
     */
    test("should convert booleans to strings", () => {
      expect(escapeCSVField(true)).toBe("true");
      expect(escapeCSVField(false)).toBe("false");
    });

    /**
     * Test null and undefined values return empty strings.
     */
    test("should return empty string for null and undefined", () => {
      expect(escapeCSVField(null)).toBe("");
      expect(escapeCSVField(undefined)).toBe("");
    });

    /**
     * Test values containing commas are properly quoted.
     */
    test("should quote fields containing commas", () => {
      expect(escapeCSVField("Hello, World")).toBe('"Hello, World"');
      expect(escapeCSVField("Item 1, Item 2, Item 3")).toBe('"Item 1, Item 2, Item 3"');
    });

    /**
     * Test values containing double quotes are properly escaped.
     */
    test("should escape double quotes by doubling them", () => {
      expect(escapeCSVField('He said "Hello"')).toBe('"He said ""Hello"""');
      expect(escapeCSVField('Quote: "Test"')).toBe('"Quote: ""Test"""');
      expect(escapeCSVField('Multiple "quotes" here "again"')).toBe(
        '"Multiple ""quotes"" here ""again"""'
      );
    });

    /**
     * Test values containing newlines are properly quoted.
     */
    test("should quote fields containing newlines", () => {
      expect(escapeCSVField("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
      expect(escapeCSVField("Line 1\r\nLine 2")).toBe('"Line 1\r\nLine 2"');
    });

    /**
     * Test values containing carriage returns are properly quoted.
     */
    test("should quote fields containing carriage returns", () => {
      expect(escapeCSVField("Line 1\rLine 2")).toBe('"Line 1\rLine 2"');
    });

    /**
     * Test complex values with multiple special characters.
     */
    test("should handle complex values with multiple special characters", () => {
      expect(escapeCSVField('Name: "John", Age: 30')).toBe('"Name: ""John"", Age: 30"');
      expect(escapeCSVField("Address: 123 Main St, City: NY\nZip: 10001")).toBe(
        '"Address: 123 Main St, City: NY\nZip: 10001"'
      );
    });

    /**
     * Test empty strings.
     */
    test("should handle empty strings", () => {
      expect(escapeCSVField("")).toBe("");
    });
  });

  describe("generateCSV", () => {
    /**
     * Test basic CSV generation with simple data.
     */
    test("should generate CSV with headers and data rows", () => {
      const data = [
        { name: "John", age: 30, city: "New York" },
        { name: "Jane", age: 25, city: "Los Angeles" },
      ];

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("name,age,city");
      expect(lines[1]).toBe("John,30,New York");
      expect(lines[2]).toBe("Jane,25,Los Angeles");
    });

    /**
     * Test CSV generation with custom headers.
     */
    test("should use custom headers when provided", () => {
      const data = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];

      const csv = generateCSV(data, {
        headers: ["Full Name", "Age"],
        columns: ["name", "age"], // Map custom headers to data columns
      });

      const lines = csv.split("\n");
      expect(lines[0]).toBe("Full Name,Age");
      expect(lines[1]).toBe("John,30");
      expect(lines[2]).toBe("Jane,25");
    });

    /**
     * Test CSV generation with column selection.
     */
    test("should filter columns when columns option is provided", () => {
      const data = [
        { name: "John", age: 30, city: "New York", email: "john@example.com" },
        { name: "Jane", age: 25, city: "Los Angeles", email: "jane@example.com" },
      ];

      const csv = generateCSV(data, {
        columns: ["name", "email"],
      });

      const lines = csv.split("\n");
      expect(lines[0]).toBe("name,email");
      expect(lines[1]).toBe("John,john@example.com");
      expect(lines[2]).toBe("Jane,jane@example.com");
      expect(lines[1]).not.toContain("30");
      expect(lines[1]).not.toContain("New York");
    });

    /**
     * Test CSV generation with values containing commas.
     */
    test("should properly escape fields containing commas", () => {
      const data = [
        { name: "John, Jr.", age: 30, city: "New York, NY" },
        { name: "Jane", age: 25, city: "Los Angeles, CA" },
      ];

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      expect(lines[1]).toBe('"John, Jr.",30,"New York, NY"');
      expect(lines[2]).toBe('Jane,25,"Los Angeles, CA"');
    });

    /**
     * Test CSV generation with values containing quotes.
     */
    test("should properly escape fields containing quotes", () => {
      const data = [
        { name: 'John "Johnny" Doe', age: 30 },
        { name: "Jane", age: 25 },
      ];

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      expect(lines[1]).toBe('"John ""Johnny"" Doe",30');
    });

    /**
     * Test CSV generation with values containing newlines.
     */
    test("should properly escape fields containing newlines", () => {
      const data = [
        { name: "John", description: "Line 1\nLine 2" },
        { name: "Jane", description: "Single line" },
      ];

      const csv = generateCSV(data);
      // The CSV should contain the quoted field with newline
      // Check that the field is properly quoted and contains the newline
      expect(csv).toContain('"Line 1');
      expect(csv).toContain('Line 2"');
      // Verify John's row contains the quoted description
      const johnRowMatch = csv.match(/John,("[^"]+")/);
      expect(johnRowMatch).toBeTruthy();
      if (johnRowMatch) {
        // The quoted field should contain the newline character
        expect(johnRowMatch[1]).toContain("\n");
      }
      // Verify Jane's row is on a separate line
      expect(csv).toContain("Jane,Single line");
    });

    /**
     * Test CSV generation with null and undefined values.
     */
    test("should handle null and undefined values", () => {
      const data = [
        { name: "John", age: 30, city: null },
        { name: "Jane", age: undefined, city: "NYC" },
      ];

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      expect(lines[1]).toBe("John,30,");
      expect(lines[2]).toBe("Jane,,NYC");
    });

    /**
     * Test CSV generation with numeric and boolean values.
     */
    test("should handle numeric and boolean values", () => {
      const data = [
        { name: "John", age: 30, active: true, score: 95.5 },
        { name: "Jane", age: 25, active: false, score: 87.0 },
      ];

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      expect(lines[1]).toBe("John,30,true,95.5");
      expect(lines[2]).toBe("Jane,25,false,87");
    });

    /**
     * Test CSV generation with transform function.
     */
    test("should apply transform function to values", () => {
      const data = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];

      const csv = generateCSV(data, {
        transform: (value, header) => {
          if (header === "age") {
            return `${value} years`;
          }
          return value.toUpperCase();
        },
      });

      const lines = csv.split("\n");
      expect(lines[1]).toBe("JOHN,30 years");
      expect(lines[2]).toBe("JANE,25 years");
    });

    /**
     * Test CSV generation with empty data array and custom headers.
     */
    test("should generate CSV with only headers when data is empty but headers provided", () => {
      const csv = generateCSV([], {
        headers: ["Name", "Age", "City"],
      });

      const lines = csv.split("\n");
      expect(lines[0]).toBe("Name,Age,City");
      expect(lines.length).toBe(2); // Header + empty line
    });

    /**
     * Test error handling for invalid input.
     */
    test("should throw error if data is not an array", () => {
      expect(() => generateCSV("not an array")).toThrow("Data must be an array");
      expect(() => generateCSV(null)).toThrow("Data must be an array");
      expect(() => generateCSV({})).toThrow("Data must be an array");
    });

    /**
     * Test error handling for empty data without headers.
     */
    test("should throw error if data is empty and no headers provided", () => {
      expect(() => generateCSV([])).toThrow(
        "Cannot generate CSV: data array is empty and no headers provided"
      );
    });

    /**
     * Test CSV generation with single row.
     */
    test("should generate CSV with single data row", () => {
      const data = [{ name: "John", age: 30 }];
      const csv = generateCSV(data);

      const lines = csv.split("\n");
      expect(lines.length).toBe(2); // Header + 1 data row
      expect(lines[0]).toBe("name,age");
      expect(lines[1]).toBe("John,30");
    });

    /**
     * Test CSV generation with many rows.
     */
    test("should generate CSV with many rows", () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
      }));

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      expect(lines.length).toBe(101); // Header + 100 data rows
      expect(lines[0]).toBe("id,name");
      expect(lines[1]).toBe("1,User 1");
      expect(lines[100]).toBe("100,User 100");
    });

    /**
     * Test CSV generation preserves column order from first object.
     */
    test("should preserve column order from first object", () => {
      const data = [
        { z: "last", a: "first", m: "middle" },
        { z: "last2", a: "first2", m: "middle2" },
      ];

      const csv = generateCSV(data);
      const lines = csv.split("\n");

      // Order should match first object's key order
      expect(lines[0]).toBe("z,a,m");
    });
  });

  describe("generateCSVWithSummary", () => {
    /**
     * Test CSV generation with summary row.
     */
    test("should append summary row to CSV data", () => {
      const data = [
        { name: "John", hours: 10 },
        { name: "Jane", hours: 15 },
      ];

      const summary = { name: "Total", hours: 25 };

      const csv = generateCSVWithSummary(data, summary);
      const lines = csv.split("\n");

      expect(lines[0]).toBe("name,hours");
      expect(lines[1]).toBe("John,10");
      expect(lines[2]).toBe("Jane,15");
      expect(lines[3]).toBe("Total,25");
    });

    /**
     * Test CSV generation with summary containing special characters.
     */
    test("should properly escape summary row values", () => {
      const data = [{ name: "John", value: 100 }];
      const summary = { name: "Total, All", value: 100 }; // Use comma which needs escaping

      const csv = generateCSVWithSummary(data, summary);
      const lines = csv.split("\n");

      expect(lines[2]).toBe('"Total, All",100');
    });
  });

  describe("generateCSVFilename", () => {
    /**
     * Test filename generation with current date.
     */
    test("should generate filename with current date by default", () => {
      const filename = generateCSVFilename("volunteers");
      const today = new Date();
      // Use UTC for consistency with the function
      const expectedDate = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;

      expect(filename).toBe(`volunteers_${expectedDate}.csv`);
      expect(filename).toMatch(/^volunteers_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    /**
     * Test filename generation with custom date.
     */
    test("should generate filename with custom date", () => {
      // Use UTC date to avoid timezone issues
      const customDate = new Date("2025-01-13T12:00:00Z");
      const filename = generateCSVFilename("events", customDate);

      // Format: YYYY-MM-DD
      const year = customDate.getUTCFullYear();
      const month = String(customDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(customDate.getUTCDate()).padStart(2, "0");
      const expected = `events_${year}-${month}-${day}.csv`;
      expect(filename).toBe(expected);
    });

    /**
     * Test filename generation with different base names.
     */
    test("should generate filename with different base names", () => {
      const date1 = new Date("2025-01-13T12:00:00Z");
      const date2 = new Date("2025-12-31T12:00:00Z");
      
      const filename1 = generateCSVFilename("volunteers", date1);
      const filename2 = generateCSVFilename("events", date1);
      const filename3 = generateCSVFilename("report", date2);
      
      expect(filename1).toMatch(/^volunteers_\d{4}-\d{2}-\d{2}\.csv$/);
      expect(filename2).toMatch(/^events_\d{4}-\d{2}-\d{2}\.csv$/);
      expect(filename3).toMatch(/^report_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    /**
     * Test filename generation with single digit months and days.
     */
    test("should pad single digit months and days with zeros", () => {
      const date = new Date("2025-01-05T12:00:00Z");
      const filename = generateCSVFilename("test", date);

      // Format should be YYYY-MM-DD with zero padding
      expect(filename).toMatch(/^test_\d{4}-\d{2}-\d{2}\.csv$/);
      expect(filename).toContain("2025-01-05");
    });
  });
});


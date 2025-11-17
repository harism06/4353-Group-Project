/**
 * @file CSV generation utility for converting arrays of data into downloadable CSV strings.
 * @module backend/utils/csvGenerator
 * @description Provides reusable functions for generating CSV files with proper formatting,
 * escaping, and header support. Handles edge cases like special characters, quotes, and newlines.
 */

/**
 * Escapes a CSV field value according to RFC 4180 standards.
 * Fields containing commas, quotes, or newlines must be enclosed in double quotes,
 * and any double quotes within the field must be escaped by doubling them.
 *
 * @param {string|number|boolean|null|undefined} value - The value to escape.
 * @returns {string} The escaped CSV field value.
 *
 * @example
 * escapeCSVField('Hello, World') // Returns: '"Hello, World"'
 * escapeCSVField('He said "Hello"') // Returns: '"He said ""Hello"""'
 * escapeCSVField(123) // Returns: '123'
 */
function escapeCSVField(value) {
  // Handle null, undefined, or empty values
  if (value === null || value === undefined) {
    return "";
  }

  // Convert to string for processing
  const stringValue = String(value);

  // Check if field needs quoting (contains comma, quote, or newline)
  const needsQuoting =
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r");

  if (needsQuoting) {
    // Escape double quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }

  return stringValue;
}

/**
 * Converts an array of objects into a CSV string with headers.
 * Each object in the array represents a row, and its keys become the column headers.
 *
 * @param {Array<Object>} data - Array of objects to convert to CSV. Each object represents a row.
 * @param {Object} [options] - Optional configuration object.
 * @param {Array<string>} [options.headers] - Custom header row. If not provided, keys from the first object are used.
 * @param {Array<string>} [options.columns] - Specific columns to include. If not provided, all keys are included.
 * @param {Function} [options.transform] - Optional transformation function for each value: (value, header, row) => string
 * @returns {string} The generated CSV string with headers and data rows.
 *
 * @throws {Error} If data is not an array or is empty and no headers are provided.
 *
 * @example
 * const data = [
 *   { name: 'John', age: 30, city: 'New York' },
 *   { name: 'Jane', age: 25, city: 'Los Angeles' }
 * ];
 * generateCSV(data);
 * // Returns: 'name,age,city\nJohn,30,New York\nJane,25,Los Angeles'
 *
 * @example
 * // With custom headers and column selection
 * generateCSV(data, {
 *   headers: ['Full Name', 'Age'],
 *   columns: ['name', 'age']
 * });
 */
function generateCSV(data, options = {}) {
  // Validate input
  if (!Array.isArray(data)) {
    throw new Error("Data must be an array");
  }

  // Handle empty data array
  if (data.length === 0) {
    if (options.headers && Array.isArray(options.headers)) {
      // Return only headers if provided
      return options.headers.map(escapeCSVField).join(",") + "\n";
    }
    throw new Error("Cannot generate CSV: data array is empty and no headers provided");
  }

  // Determine headers and columns
  let headers = options.headers;
  let columns;

  if (!headers) {
    // Extract headers from first object's keys
    headers = Object.keys(data[0]);
    columns = options.columns || headers;
    // If columns are specified, filter headers to match
    if (options.columns) {
      headers = headers.filter((h) => columns.includes(h));
    }
  } else {
    // If custom headers are provided, use original data keys as columns
    // unless columns are explicitly specified
    if (options.columns) {
      columns = options.columns;
      // If columns are specified, headers should match in length
      if (headers.length !== columns.length) {
        throw new Error("Headers and columns arrays must have the same length");
      }
    } else {
      // Use data keys as columns, but headers for display
      columns = Object.keys(data[0]);
      // If headers length doesn't match columns, use columns as-is
      if (headers.length !== columns.length) {
        columns = headers; // Fallback: use headers as columns
      }
    }
  }

  // Generate header row
  const headerRow = headers.map(escapeCSVField).join(",");

  // Generate data rows
  const dataRows = data.map((row) => {
    const rowValues = columns.map((column) => {
      let value = row[column];

      // Apply transformation if provided
      if (options.transform && typeof options.transform === "function") {
        value = options.transform(value, column, row);
      }

      return escapeCSVField(value);
    });

    return rowValues.join(",");
  });

  // Combine header and data rows
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generates a CSV string with summary statistics appended at the end.
 * Useful for reports that need totals or aggregated data.
 *
 * @param {Array<Object>} data - Array of objects to convert to CSV.
 * @param {Object} summary - Summary statistics object to append.
 * @param {Object} [options] - Optional configuration (same as generateCSV).
 * @returns {string} The generated CSV string with data and summary rows.
 *
 * @example
 * const data = [{ name: 'John', hours: 10 }, { name: 'Jane', hours: 15 }];
 * const summary = { name: 'Total', hours: 25 };
 * generateCSVWithSummary(data, summary);
 */
function generateCSVWithSummary(data, summary, options = {}) {
  const csvData = generateCSV(data, options);
  const summaryRow = Object.values(summary)
    .map((value) => escapeCSVField(value))
    .join(",");
  return csvData + "\n" + summaryRow;
}

/**
 * Creates a properly formatted filename with timestamp for CSV downloads.
 * Uses UTC date to ensure consistent filenames across timezones.
 *
 * @param {string} baseName - Base name for the file (e.g., 'volunteers', 'events').
 * @param {Date} [date] - Optional date to use for timestamp. Defaults to current date.
 * @returns {string} Formatted filename (e.g., 'volunteers_2025-01-13.csv').
 *
 * @example
 * generateCSVFilename('volunteers') // Returns: 'volunteers_2025-01-13.csv'
 */
function generateCSVFilename(baseName, date = new Date()) {
  // Use UTC methods for consistent filenames across timezones
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const timestamp = `${year}-${month}-${day}`;
  return `${baseName}_${timestamp}.csv`;
}

module.exports = {
  escapeCSVField,
  generateCSV,
  generateCSVWithSummary,
  generateCSVFilename,
};


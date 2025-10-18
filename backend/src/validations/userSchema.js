const { z } = require("zod");

// Schema for updating user profile
const userProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(50, "Full name must be 50 characters or less"),

  address1: z
    .string()
    .min(1, "Address is required")
    .max(100, "Address must be 100 characters or less"),

  address2: z
    .string()
    .max(100, "Address must be 100 characters or less")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be 100 characters or less"),

  state: z
    .string()
    .min(2, "State is required")
    .max(2, "State must be a 2-letter code"),

  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid zip code (12345 or 12345-6789)"),

  skills: z.array(z.string()).min(1, "Please select at least one skill"),

  preferences: z.string().optional().or(z.literal("")),

  availability: z
    .array(z.string())
    .min(1, "Please select at least one available date"),
});

module.exports = { userProfileSchema };

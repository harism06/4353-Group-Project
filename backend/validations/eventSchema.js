const { z } = require("zod");

const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  location: z.string().min(2, "Location is required"),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"), // ✅ matches frontend
  urgency: z.enum(["Low", "Medium", "High"]),
  date: z.string().min(4, "Event date is required"),
});

module.exports = { eventSchema };

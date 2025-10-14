const { z } = require("zod");

const eventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters"),
  requiredSkills: z.array(z.string()).min(1, "At least one skill required"),
  urgency: z.enum(["Low", "Medium", "High"]),
  location: z.string().min(2, "Location is required"),
});

module.exports = { eventSchema };

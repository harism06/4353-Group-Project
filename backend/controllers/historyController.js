const { randomUUID } = require("crypto");
const history = require("../data/history");
// Prisma is optional at runtime; dynamically load when available
const {
  createHistoryInputSchema,
  getHistoryByUserIdSchema,
} = require("../validations/historySchema");

// Volunteer history controller functions
exports.createHistoryRecord = (req, res) => {
  console.log("Received history body:", req.body);

  try {
    // Validate the incoming request body
    const validatedInput = createHistoryInputSchema.parse(req.body);

    const newHistoryRecord = {
      id: randomUUID(),
      userId: validatedInput.userId,
      eventId: validatedInput.eventId,
      activityType: validatedInput.activityType,
      timestamp: new Date().toISOString(),
      details: validatedInput.details,
    };

    history.push(newHistoryRecord);

    // Try to save to DB if Prisma is available
    (async () => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const status = validatedInput.activityType;
        const hours = 0;
        const dateParticipated = new Date();
        await prisma.volunteerHistory.create({
          data: {
            id: newHistoryRecord.id,
            userId: String(validatedInput.userId),
            eventId: String(validatedInput.eventId),
            status,
            hours,
            dateParticipated,
          }
        });
        await prisma.$disconnect();
      } catch (_e) { /* ignore DB issues in mock mode */ }
    })();

    return res.status(201).json(newHistoryRecord);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getHistoryByUserId = (req, res) => {
  try {
    console.log(" Received history body:", req.body);

    const { userId } = req.params;

    // Validate the userId parameter against the schema
    getHistoryByUserIdSchema.parse({ userId });

    const userHistory = history.filter((record) => record.userId === userId);
    return res.status(200).json(userHistory);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

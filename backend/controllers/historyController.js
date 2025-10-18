const { randomUUID } = require("crypto");
const history = require("../data/history");
const {
  createHistoryInputSchema,
  getHistoryByUserIdSchema,
} = require("../validations/historySchema");

exports.createHistoryRecord = (req, res) => {
  try {
    const validatedInput = createHistoryInputSchema.parse(req.body);

    const newHistoryRecord = {
      id: randomUUID(),
      ...validatedInput,
      timestamp: new Date().toISOString(),
    };

    history.push(newHistoryRecord);
    return res.status(201).json(newHistoryRecord);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }

    console.error("Failed to create history record:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getHistoryByUserId = (req, res) => {
  try {
    const { userId } = getHistoryByUserIdSchema.parse(req.params);
    const userHistory = history.filter((record) => record.userId === userId);
    return res.status(200).json(userHistory);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }

    console.error("Failed to fetch history records:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

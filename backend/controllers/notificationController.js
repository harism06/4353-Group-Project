const { randomUUID } = require("crypto");
const notifications = require("../data/notifications");
const {
  createNotificationInputSchema,
} = require("../validations/notificationSchema");

// Notification controller functions
exports.createNotification = (req, res) => {
  try {
    // Validate the incoming request body
    const validatedInput = createNotificationInputSchema.parse(req.body);

    const newNotification = {
      id: randomUUID(),
      userId: validatedInput.userId,
      eventId: validatedInput.eventId,
      message: validatedInput.message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    notifications.push(newNotification);
    
    // Check if this is an assignment notification for future hooks
    if (String(validatedInput.message).toLowerCase().includes('assigned')) {
      // Future: could trigger additional assignment logic here
    }
    return res.status(201).json(newNotification);
  } catch (error) {
    // Handle Zod validation errors
    if (error.errors) {
      return res.status(400).json({ errors: error.errors });
    }
    // Handle other potential errors
    return res.status(500).json({ message: "Internal server error" });
  }
};

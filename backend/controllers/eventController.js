const { events } = require("../data/events");
const { eventSchema } = require("../validations/eventSchema");

function getEvents(req, res) {
  res.status(200).json(events);
}

function createEvent(req, res) {
  try {
    console.log("📩 Incoming POST body:", req.body);
    const validated = eventSchema.parse(req.body);
    const newEvent = { id: events.length + 1, ...validated };
    events.push(newEvent);
    console.log(" Created event:", newEvent);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error(" Validation or other error:", err);
    res.status(400).json({ error: err.errors || err.message });
  }
}

module.exports = { getEvents, createEvent };

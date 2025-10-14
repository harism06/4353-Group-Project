const events = require("../data/events");
const { eventSchema } = require("../validations/eventSchema");

function getEvents(req, res) {
  res.status(200).json(events);
}

function createEvent(req, res) {
  try {
    const validated = eventSchema.parse(req.body);
    const newEvent = { id: events.length + 1, ...validated };
    events.push(newEvent);
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ error: err.errors });
  }
}

module.exports = { getEvents, createEvent };

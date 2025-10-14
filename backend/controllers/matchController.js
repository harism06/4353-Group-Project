const events = require("../data/events");
const users = require("../data/users");

function matchVolunteers(req, res) {
  const eventId = parseInt(req.params.eventId);
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  const matches = users
    .map((user) => {
      const sharedSkills = user.skills.filter((skill) =>
        event.requiredSkills.includes(skill)
      );
      return { ...user, matchScore: sharedSkills.length };
    })
    .filter((u) => u.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json(matches);
}

module.exports = { matchVolunteers };

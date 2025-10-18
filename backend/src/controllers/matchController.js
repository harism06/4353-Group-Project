const users = require("../data/users");
const { events } = require("../data/events");

exports.getAllMatches = (req, res) => {
  try {
    const matches = [];

    users.forEach((user) => {
      events.forEach((event) => {
        const sharedSkills = user.skills.filter((s) =>
          event.requiredSkills.includes(s)
        );

        if (sharedSkills.length > 0) {
          matches.push({
            volunteerId: user.id,
            volunteerName: user.name,
            eventId: event.id,
            eventName: event.name,
            sharedSkills,
            date: event.date,
          });
        }
      });
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Error generating matches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.matchVolunteers = (req, res) => {
  console.log("Incoming match request:", req.params, req.body);
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
      return { ...user, matchScore: sharedSkills.length, sharedSkills };
    })
    .filter((u) => u.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  console.log("Match response being sent:", matches.length);
  res.status(200).json(matches);
};

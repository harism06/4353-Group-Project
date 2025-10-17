const { events } = require("../data/events");
const users = require("../data/users");

/**
 * @file Volunteer matching controller functions.
 * @module backend/controllers/matchController
 */

/**
 * Handles GET request to match volunteers with a specific event.
 * Finds volunteers whose skills match the event's required skills.
 * Calculates a match score based on the number of shared skills.
 * Returns volunteers sorted by match score in descending order.
 * @function
 * @param {Object} req - Express request object. Expected to contain `eventId` in `req.params`.
 * @param {Object} res - Express response object.
 * @returns {Object} 200 status with array of matched volunteers, or 404 if event not found
 */
function matchVolunteers(req, res) {
  // Log incoming request for debugging
  console.log("🔍 Incoming match request:", req.params, req.body);
  
  // Parse the event ID from URL params
  const eventId = parseInt(req.params.eventId);
  
  // Find the event in the mock data store
  const event = events.find((e) => e.id === eventId);

  // Return 404 if event doesn't exist
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }

  // Match volunteers based on skill overlap with event requirements
  const matches = users
    // Map each user to include a match score
    .map((user) => {
      // Find skills that the user has that match the event's required skills
      const sharedSkills = user.skills.filter((skill) =>
        event.requiredSkills.includes(skill)
      );
      
      // Return user object with added matchScore property
      // matchScore represents the number of matching skills
      return { ...user, matchScore: sharedSkills.length };
    })
    // Filter out users with no matching skills (matchScore = 0)
    .filter((u) => u.matchScore > 0)
    // Sort by matchScore in descending order (highest matches first)
    .sort((a, b) => b.matchScore - a.matchScore);

  // Log the matching results for debugging
  console.log(
    "✅ Match response being sent:",
    matches.length > 0 ? matches : "no matches found"
  );
  
  // Return the matched volunteers with 200 OK status
  res.status(200).json(matches);
}

module.exports = { matchVolunteers };

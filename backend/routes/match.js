const express = require("express");
const {
  matchVolunteers,
  getAllMatches,
} = require("../controllers/matchController");
const router = express.Router();

router.get("/all", getAllMatches);

router.get("/:eventId", matchVolunteers);

module.exports = router;

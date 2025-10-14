const express = require("express");
const { matchVolunteers } = require("../controllers/matchController");
const router = express.Router();

router.get("/:eventId", matchVolunteers);

module.exports = router;

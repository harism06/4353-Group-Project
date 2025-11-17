const express = require('express');
const router = express.Router();
const { getStates } = require('../controllers/stateController');

// States routes

router.get('/', getStates);

module.exports = router;



const express = require('express');
const router = express.Router();
const { getStates } = require('../controllers/stateController');

/**
 * @file States routes.
 * @module backend/routes/states
 */

router.get('/', getStates);

module.exports = router;



const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.send('Auth route OK'));
// TODO: later import controller functions
// const { register, login } = require('../controllers/authController');
// router.post('/register', register);
// router.post('/login', login);
module.exports = router;

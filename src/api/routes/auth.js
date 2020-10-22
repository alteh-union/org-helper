const express = require('express');
const auth = express.Router();
const usersAuth = require('../controllers/auth');

auth.get('/login', usersAuth.makeRedirect);

module.exports = auth;

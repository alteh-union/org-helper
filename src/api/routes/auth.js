const express = require('express');
const auth = express.Router();
const authController = require('../controllers/auth');

auth.get('/discord/go-to-discord-auth', authController.makeRedirectToDiscordAuth);
auth.get('/discord/jwt', authController.getJwtByDiscordAuthCode);

module.exports = auth;

const express = require('express');
const auth = express.Router();
const authController = require('../controllers/auth');

auth.get('/discord/go-to-discord-auth', authController.makeRedirectToDiscordAuth);
auth.get('/discord/jwt', authController.getJwtByDiscordAuthCode);
// todo: remove this demo endpoint
auth.get('/secured-endpoint', authController.callSecuredEndpoint);

module.exports = auth;

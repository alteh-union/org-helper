'use strict';

/**
 * @module auth
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const express = require('express');
const auth = express.Router();
const authController = require('../controllers/auth');

auth.get('/discord/go-to-discord-auth', authController.makeRedirectToDiscordAuth);
auth.get('/discord/jwt', authController.getJwtByDiscordAuthCode);
// todo: remove this demo endpoint
auth.get('/secured-endpoint', authController.callSecuredEndpoint);

/**
 * Exports the express router for handling auth-related requests from UI clients.
 */
module.exports = auth;

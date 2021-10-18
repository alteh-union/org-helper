'use strict';

/**
 * @module jwt
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const expressJwt = require('express-jwt');

/**
 * Generates a JWT middleware to check if the user's token is valid.
 * All standard operations (after authentication) should have the token verified.
 * The express JWT middleware is generated using a secret string from the Bot's preferences.
 * @param  {Context} context the Bot's context
 * @return {Object}          the JWT middleware
 */
function jwt(context) {
  const secret = context.prefsManager.jwt_secret;
  return expressJwt({ secret, algorithms: ['HS256'] }).unless({
    path: ['/users/authenticate', '/auth/discord/go-to-discord-auth', '/auth/discord/jwt']
  });
}

/**
 * Exports the function to handle the JWT security check for UI clients.
 */
module.exports = jwt;

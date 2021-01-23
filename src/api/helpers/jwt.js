const expressJwt = require('express-jwt');

module.exports = jwt;

function jwt(context) {
  const secret = context.prefsManager.jwt_secret;
  return expressJwt({ secret, algorithms: ['HS256'] }).unless({
    path: ['/users/authenticate', '/auth/discord/go-to-discord-auth', '/auth/discord/jwt']
  });
}

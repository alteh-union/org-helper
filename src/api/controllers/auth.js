'use strict';

/**
 * @module auth
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

/**
 * Redirects a web-client to the Discord auth page. Mobile app clients can do this internally,
 * without calling this endpoint.
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
const makeRedirectToDiscordAuth = async (req, res, next) => {
  try {
    const context = req.app.get('context');
    const appId = context.prefsManager.app_id;
    const redirectUrl = encodeURIComponent(context.prefsManager.frontend_url + 'discord-auth');

    res.redirect(
      `https://discord.com/api/oauth2/authorize` +
        `?client_id=${appId}` +
        `&redirect_uri=${redirectUrl}` +
        `&response_type=code` +
        `&scope=identify`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Gets a Discord user's info based on the OAuth code and generates a JWT token accordingly.
 * The token is sent back to the UI client and will be used as a kind of a "password", until it expires.
 * The necessary Discord info about the user is sent back as well after being saved to the server's DB.
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
const getJwtByDiscordAuthCode = async (req, res, next) => {
  try {
    const code = req.query.code;
    const redirectUrl = req.query.redirect_uri;
    const context = req.app.get('context');
    const prefsManager = context.prefsManager;
    const authInfo = await requestDiscordToken(context, code, redirectUrl, prefsManager);

    if (!authInfo.access_token) {
      throw new Error('Unauthorized error');
    }
    const discordUser = await requestDiscordUser(authInfo.access_token);

    if (!discordUser.id) {
      throw new Error('Unauthorized error');
    }
    const user = await createOrUpdateUser(discordUser, context);
    let avatarLink = null;
    if (user.discordInfo.avatar) {
      avatarLink = "https://cdn.discordapp.com/avatars/" + user.discordInfo.id + "/" + user.discordInfo.avatar + ".png";
    }
    const token = jwt.sign({ sub: user._id }, prefsManager.jwt_secret, { expiresIn: '1d' });
    res.status(200).send({ id: user._id, username: user.discordInfo.username, avatar: avatarLink, token: token });
  } catch (error) {
    next(error);
  }
};

/**
 * Asks the Discord server to authorize the Bot's application to work with the user.
 * The code received during authentication is used to verify that the user indeed granted the access for the app.
 * @param  {Context}         context      the Bot's context
 * @param  {string}          code         the OAuth code received during authentication
 * @param  {string}          redirectUrl  the redirect URL, should match the URL which was used during authentication
 * @param  {PrefsManager}    prefsManager the Bot's preference manager
 * @return {Promise<Object>}              the JSON object response from the Discord authorization page
 */
async function requestDiscordToken(context, code, redirectUrl, prefsManager) {
  const data = {
    client_id: prefsManager.app_id,
    client_secret: prefsManager.discord_secret,
    grant_type: 'authorization_code',
    redirect_uri: (redirectUrl) || prefsManager.frontend_url + 'discord-auth',
    code: code,
    scope: 'identify'
  };

  return (
    await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
  ).json();
}

/**
 * Gets the user info by the access token.
 * @param  {string}          accessToken the OAuth code received during authentication
 * @return {Promise<Object>}             the JSON object response with the info about the Discord user
 */
async function requestDiscordUser(accessToken) {
  return await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  }).then(response => response.json());
}

/**
 * Inserts or replaces a Discord user in the Bot's DB based on the user's info received from the Discord server.
 * @param  {Object}          discordUser the user object as received from the Discord server
 * @param  {Context}         context     the Bot's context
 * @return {Promise<Object>}             the user object from the Bot's DB table
 */
async function createOrUpdateUser(discordUser, context) {
  const users = context.dbManager.dbo.collection('users');
  const searchCriteria = { 'discordInfo.id': discordUser.id };
  const newDiscordInfo = {
    id: discordUser.id,
    username: discordUser.username,
    avatar: discordUser.avatar,
    discriminator: discordUser.discriminator
  };
  const user = await users.findOne(searchCriteria);
  if (user) {
    await users.updateOne(searchCriteria, { $set: { discordInfo: newDiscordInfo } });
  } else {
    await users.insertOne({
      id: discordUser.id,
      discordInfo: newDiscordInfo
    });
  }
  return await users.findOne(searchCriteria);
}

// todo: remove this demo endpoint
async function callSecuredEndpoint(req, res) {
  res.status(200).send();
}

/**
 * Exports the functions to handle auth-related web-endpoints for UI clients.
 */
module.exports = {
  makeRedirectToDiscordAuth,
  getJwtByDiscordAuthCode,
  callSecuredEndpoint
};

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

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

const getJwtByDiscordAuthCode = async (req, res, next) => {
  try {
    const code = req.query.code;
    const context = req.app.get('context');
    const prefsManager = context.prefsManager;
    const authInfo = await requestDiscordToken(code, prefsManager);

    if (!authInfo.access_token) {
      throw new Error('Unauthorized error');
    }
    const discordUser = await requestDiscordUser(authInfo.access_token);

    if (!discordUser.id) {
      throw new Error('Unauthorized error');
    }
    const user = await createOrUpdateUser(discordUser, context);
    const token = jwt.sign({ sub: user._id }, prefsManager.jwt_secret, { expiresIn: '1d' });
    res.status(200).send({ id: user._id, username: user.username, token });
  } catch (error) {
    next(error);
  }
};

async function requestDiscordToken(code, prefsManager) {
  const data = {
    client_id: prefsManager.app_id,
    client_secret: prefsManager.discord_secret,
    grant_type: 'authorization_code',
    redirect_uri: prefsManager.frontend_url + 'discord-auth',
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

async function requestDiscordUser(accessToken) {
  return await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  }).then(response => response.json());
}

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
      username: discordUser.username,
      discordInfo: newDiscordInfo
    });
  }
  return await users.findOne(searchCriteria);
}

// todo: remove this demo endpoint
async function callSecuredEndpoint(req, res) {
  res.status(200).send();
}

module.exports = {
  makeRedirectToDiscordAuth,
  getJwtByDiscordAuthCode,
  callSecuredEndpoint
};

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { v4: randomUuid } = require('uuid');

const makeRedirectToDiscordAuth = async (req, res) => {
  const context = req.app.get('context');
  const appId = context.prefsManager.app_id;
  const redirectUrl = encodeURIComponent(context.prefsManager.oauth_redirect_url);

  res.redirect(
    `https://discord.com/api/oauth2/authorize` +
      `?client_id=${appId}` +
      `&redirect_uri=${redirectUrl}` +
      `&response_type=code` +
      `&scope=identify`
  );
};

const getJwtByDiscordAuthCode = async (req, res, next) => {
  try {
    const code = req.query.code;
    console.log(code);
    const prefsManager = req.app.get('context').prefsManager;
    const authInfo = await requestDiscordToken(code, prefsManager);
    console.log(authInfo);
    const discordUser = await requestDiscordUser(authInfo.access_token);
    console.log(discordUser);

    const reducedUser = {
      id: discordUser.id,
      username: discordUser.username,
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator
    };
    console.log(reducedUser);

    const user = {
      id: randomUuid(),
      username: discordUser.username,
      discordInfo: reducedUser
    };
    console.log(user);

    const secret = prefsManager.jwt_secret;
    const token = jwt.sign({ sub: user.id }, secret, { expiresIn: '1d' });
    res.status(200).send({ token });
  } catch (e) {
    next(e);
  }
};

async function requestDiscordToken(code, prefsManager) {
  const data = {
    client_id: prefsManager.app_id,
    client_secret: 'J3x6yUDkOGERlKUCLqf7nDyuWJ7TwrBC',
    grant_type: 'authorization_code',
    redirect_uri: prefsManager.oauth_redirect_url,
    code: code,
    scope: 'identify'
  };

  return await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams(data),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => response.json());
}

async function requestDiscordUser(accessToken) {
  return await fetch(`https://discord.com/api/users/@me`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  }).then(response => response.json());
}

module.exports = {
  makeRedirectToDiscordAuth,
  getJwtByDiscordAuthCode
};

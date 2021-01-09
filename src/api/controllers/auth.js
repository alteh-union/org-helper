const makeRedirect = async (req, res) => {
  const context = req.app.get('context');
  const appId = context.prefsManager.app_id;
  const redirectUrl = context.prefsManager.redirect_url;

  try {
    res.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${appId}&redirect_uri=${redirectUrl}}&response_type=code&scope=identify`
    );
  } catch (e) {
    res.status(401).send('error: ' + e);
  }
};

module.exports = {
  makeRedirect
};

const path = require('path');
const prefsPath = path.join(__dirname, '../../../', 'preferences.txt');
const PrefsManager = require('../../managers/prefs-manager');
const prefsManager = new PrefsManager(prefsPath);

prefsManager.readPrefs();

const makeRedirect = async (req, res) => {
  try {
    res.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${prefsManager.app_id}&redirect_uri=${prefsManager.redirect_url}}&response_type=code&scope=identify`
    );
    return;
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  makeRedirect
};

'use strict';

/**
 * @module prefs-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const fs = require('fs');

const SecuredPreferences = Object.freeze(['test_discord_token']);

/**
 * Keeps Bot-wide preferences (settings related to the bot's server itself).
 * @alias PrefsManager
 */
class PrefsManager {
  /**
   * Constructs an instance of the class
   * @param {string} prefsPath the path to the preferences path
   */
  constructor(prefsPath) {
    this.prefsPath = prefsPath;
  }

  /**
   * Reads the preferences synchronously
   */
  readPrefs() {
    const contents = fs.readFileSync(this.prefsPath, 'utf8');
    const lines = contents.split('\n');
    for (const line of lines) {
      if (line.length === 0 || line.startsWith('//')) {
        continue;
      }

      const pref = line.split('=');
      if (pref.length !== 2) {
        console.log('Malformed preferences line: ' + line);
        continue;
      }

      const trimmedName = pref[0].trim();
      const trimmedValue = pref[1].trim();

      this[trimmedName] = trimmedValue;

      console.log(
        'PrefsManager: got preference: ' +
          trimmedName +
          ' with value: ' +
          (SecuredPreferences.includes(trimmedName) ? '<HIDDEN>' : trimmedValue)
      );
    }
  }

  /**
   * Checks if specific preference value is a template value or missing
   * @param  {string}  pref the preference to check
   * @return {Boolean}      true if undefined, null or enclosed in angle brackets, false otherwise
   */
  isNullOrTemplate(pref) {
    return (pref === undefined || pref === null || (pref.startsWith('<') && pref.endsWith('>')));
  }
}

/**
 * Exports the PrefsManager class
 * @type {PrefsManager}
 */
module.exports = PrefsManager;

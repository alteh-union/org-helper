'use strict';

/**
 * @module lang-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const util = require('util');
const fs = require('fs');
const path = require('path');

const StringsPrefix = 'strings_';
const JsonSuffix = '.json';
const DefaultLocale = 'en-US';

/**
 * Provides strings for UI depending on the selected locale.
 * Typically one instance should exist for the Context (with organization-wide locale),
 * and one instance for each command, because individual users also may choose their
 * preferred language.
 * @alias LangManager
 */
class LangManager {
  /**
   * Constructs an instance of the class.
   * @param {string} localizationPath path to locale resources
   * @param {string} localeName       locale name to initialize the manager with
   */
  constructor(localizationPath, localeName) {
    LangManager.LOCALES_PATH = localizationPath;
    LangManager.loadLocales();
    this.setLocale(localeName);
  }

  /**
   * Gets the path with locale resources.
   * @type {string}
   */
  static get LOCALES_PATH() {
    return this.localizationPath;
  }

  /**
   * Sets the path with locale resources.
   * @type {string}
   */
  static set LOCALES_PATH(localizationPath) {
    this.localizationPath = localizationPath;
  }

  /**
   * Gets the array of available locales.
   * @type {Array<Object>}
   */
  static get LOCALES() {
    if (this.locales === undefined && this.localizationPath !== undefined) {
      this.loadLocales();
    }

    return this.locales;
  }

  /**
   * Loads the locales from the file system.
   */
  static loadLocales() {
    if (this.locales !== undefined) {
      return;
    }

    this.locales = {};

    const files = fs.readdirSync(this.localizationPath);
    for (const fileName of files) {
      if (!fileName.startsWith(StringsPrefix)) {
        continue;
      }

      if (!fileName.endsWith(JsonSuffix)) {
        continue;
      }

      const localeName = fileName.slice(StringsPrefix.length, fileName.length - JsonSuffix.length);

      const filePath = path.join(this.localizationPath, fileName);

      const rawdata = fs.readFileSync(filePath, 'utf8');
      const locale = JSON.parse(rawdata);

      this.locales[localeName] = locale;
    }
  }

  /**
   * Sets the locale for this instance
   * @param {string} localeName the locale name
   */
  setLocale(localeName) {
    this.currentLocale = this.getLocale(localeName);
  }

  /**
   * Gets the names of available locales.
   * @return {Array<string>} the locale names
   */
  getLocales() {
    return Object.keys(LangManager.LOCALES);
  }

  /**
   * Gets locale object by it's name. If not found - gets the default locale.
   * @param  {string} name the name
   * @return {Object}      the locale object
   */
  getLocale(name) {
    const localeNames = this.getLocales();
    for (const localeName of localeNames) {
      if (localeName === name) {
        return LangManager.LOCALES[localeName];
      }
    }

    return this.getDefaultLocale();
  }

  /**
   * Gets the default locale.
   * @return {Object} the locale object
   */
  getDefaultLocale() {
    return LangManager.LOCALES[DefaultLocale];
  }

  /**
   * Gets a localized/translated string by it's id in the locale resources.
   * Formats the string according to the additional arguments.
   * @param  {Array<string>} args the text id, and additional arguments for formatting, if needed
   * @return {string}             the localized and formatted string
   */
  getString(...args) {
    let formatString = '';
    if (this.currentLocale[args[0]] === undefined) {
      formatString = this.getDefaultLocale()[args[0]];
    } else {
      formatString = this.currentLocale[args[0]];
    }

    args[0] = formatString;
    return util.format(...args);
  }

  /**
   * Prints missing localizations comparing to the default locale. For debugging purposes.
   * @param  {Log}    log the log object which will print the missing translations
   */
  printMissingTranslations(log) {
    const defaultLocale = this.getDefaultLocale();
    const defaultLocaleKeys = Object.keys(defaultLocale);

    const localeNames = this.getLocales();
    for (const name of localeNames) {
      if (DefaultLocale === name) {
        continue;
      }

      for (const textId of defaultLocaleKeys) {
        if (LangManager.LOCALES[name][textId] === undefined) {
          log.w('LangManager: locale "' + name + '" is missing translation for key: "' +
              textId + '"');
        }
      }
    }
  }
}

/**
 * Exports the LangManager class
 * @type {LangManager}
 */
module.exports = LangManager;

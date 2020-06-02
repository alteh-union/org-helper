'use strict';

/**
 * @module user-settings-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotTable = require('./bot-table');
const UserSettingRow = require('./user-setting-row');

const MultiLangValue = require('../utils/multi-lang-value');

const USER_SETTINGS_TABLE_NAME = 'user_settings';

const DefinedSettings = Object.freeze({
  localeName: new MultiLangValue('localeName', 'setting_locale_name'),
  timezone: new MultiLangValue('timezone', 'setting_timezone')
});

/**
 * Represents settings table for users in servers (organizations).
 * @see UserSettingRow
 * @alias UserSettingsTable
 * @extends BotTable
 */
class UserSettingsTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get USER_SETTINGS_TABLE_NAME() {
    return USER_SETTINGS_TABLE_NAME;
  }

  /**
   * Array of the defined settings in form of multi-lang values.
   * @type {Array<Object>}
   */
  static get USER_SETTINGS() {
    return DefinedSettings;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(USER_SETTINGS_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return UserSettingRow;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new UserSettingRow(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return USER_SETTINGS_TABLE_NAME;
  }

  /**
   * Gets a setting with a given name for the given organization and user. Return default, if not found.
   * @param  {string}  source       the source name (Discord etc.)
   * @param  {string}  orgId        the organization id (depends on the source)
   * @param  {string}  userId       the user id (depends on the source)
   * @param  {string}  settingName  the name of the setting
   * @param  {Object}  defaultValue value to be returned if the setting is not set
   * @return {Promise<Object>}              [description]
   */
  async getSetting(source, orgId, userId, settingName, defaultValue) {
    const query = {
      source,
      orgId,
      userId,
      settingName
    };

    // False positive, the unicorn thinks that "query" is a function here.
    /* eslint-disable unicorn/no-fn-reference-in-iterator */
    const rawRows = await this.dbManager.dbo.collection(this.getTableName()).find(query).toArray();
    /* eslint-enable unicorn/no-fn-reference-in-iterator */

    if (rawRows[0] !== undefined && rawRows[0].settingValue !== undefined) {
      return rawRows[0].settingValue;
    }

    return defaultValue;
  }

  /**
   * Sets a setting with the given name for the given organization and user.
   * @param  {string}  source       the source name (Discord etc.)
   * @param  {string}  orgId        the organization id (depends on the source)
   * @param  {string}  userId       the user id (depends on the source)
   * @param  {string}  settingName  the name of the setting
   * @param  {Object}  value        the value to be set
   * @return {Promise}              nothing
   */
  async setSetting(source, orgId, userId, settingName, value) {
    const setting = {
      source,
      orgId,
      userId,
      settingName,
      settingValue: value
    };

    await this.insertOrUpdate(setting);
  }

  /**
   * Removes value of the setting for the given organization and user.
   * @param  {string}  source       the source name (Discord etc.)
   * @param  {string}  orgId        the organization id (depends on the source)
   * @param  {string}  userId       the user id (depends on the source)
   * @param  {string}  settingName  the name of the setting
   * @return {Promise}              nothing
   */
  async removeSetting(source, orgId, userId, settingName) {
    const deleteQuery = {
      source,
      orgId,
      userId,
      settingName
    };

    await this.dbManager.dbo.collection(this.getTableName()).deleteOne(deleteQuery);
  }
}

/**
 * Exports the UserSettingsTable class
 * @type {UserSettingsTable}
 */
module.exports = UserSettingsTable;

'use strict';

/**
 * @module server-settings-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const ServerSettingRow = require('./server-setting-row');

const MultiLangValue = require('../utils/multi-lang-value');

const SERVER_SETTINGS_TABLE_NAME = 'server_settings';

const DefinedSettings = Object.freeze({
  commandPrefix: new MultiLangValue('commandPrefix', 'setting_command_prefix'),
  localeName: new MultiLangValue('localeName', 'setting_locale_name'),
  timezone: new MultiLangValue('timezone', 'setting_timezone'),
  badwords: new MultiLangValue('badwords', 'setting_badwords'),
  censoring: new MultiLangValue('censoring', 'setting_censoring')
});

/**
 * Represents settings table for user's servers (organizations).
 * @see ServerSettingRow
 * @alias ServerSettingsTable
 * @extends BotTable
 */
class ServerSettingsTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get SERVER_SETTINGS_TABLE_NAME() {
    return SERVER_SETTINGS_TABLE_NAME;
  }

  /**
   * Array of the defined settings in form of multi-lang values.
   * @type {Array<Object>}
   */
  static get SERVER_SETTINGS() {
    return DefinedSettings;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(SERVER_SETTINGS_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return ServerSettingRow;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new ServerSettingRow(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return SERVER_SETTINGS_TABLE_NAME;
  }

  /**
   * Gets a setting with a given name for the given organization. Return default, if not found.
   * @param  {string}  source       the source name (Discord etc.)
   * @param  {string}  orgId        the organization id (depends on the source)
   * @param  {string}  settingName  the name of the setting
   * @param  {Object}  defaultValue value to be returned if the setting is not set
   * @return {Promise<Object>}              [description]
   */
  async getSetting(source, orgId, settingName, defaultValue) {
    const query = {
      source,
      orgId,
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
   * Sets a setting with the given name for the given organization.
   * @param  {string}  source       the source name (Discord etc.)
   * @param  {string}  orgId        the organization id (depends on the source)
   * @param  {string}  settingName  the name of the setting
   * @param  {Object}  value        the value to be set
   * @return {Promise}              nothing
   */
  async setSetting(source, orgId, settingName, value) {
    const setting = {
      source,
      orgId,
      settingName,
      settingValue: value
    };

    await this.insertOrUpdate(setting);
  }

  /**
   * Removes value of the setting for the given organization.
   * @param  {string}  source       the source name (Discord etc.)
   * @param  {string}  orgId        the organization id (depends on the source)
   * @param  {string}  settingName  the name of the setting
   * @return {Promise}              nothing
   */
  async removeSetting(source, orgId, settingName) {
    const deleteQuery = {
      source,
      orgId,
      settingName
    };

    await this.dbManager.dbo.collection(this.getTableName()).deleteOne(deleteQuery);
  }
}

/**
 * Exports the ServerSettingsTable class
 * @type {ServerSettingsTable}
 */
module.exports = ServerSettingsTable;

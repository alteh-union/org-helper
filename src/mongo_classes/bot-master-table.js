'use strict';

/**
 * @module bot-master-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const BotMasterRow = require('./bot-master-row');

const BOT_MASTER_TABLE_NAME = 'bot_master';

const DefinedMasterSettings = Object.freeze({
  dbVersion: 'dbVersion'
});

/**
 * Represents the table of master (bot-wide) settings.
 * Unlike the content of preferences.xml file, these settings are not supposed to be constant.
 * @see BotMasterRow
 * @alias BotMasterTable
 * @extends BotTable
 */
class BotMasterTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get BOT_MASTER_TABLE_NAME() {
    return BOT_MASTER_TABLE_NAME;
  }

  /**
   * Array of the defined master settings.
   * @type {Array<Object>}
   */
  static get MASTER_SETTINGS() {
    return DefinedMasterSettings;
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return BotMasterRow;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new BotMasterRow(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return BOT_MASTER_TABLE_NAME;
  }

  /**
   * Gets a setting with a given name. Return default, if not found.
   * @param  {string}          settingName  the name of the setting
   * @param  {Object}          defaultValue value to be returned if the setting is not set
   * @return {Promise<Object>}              the result value
   */
  async getSetting(settingName, defaultValue) {
    const query = { settingName };

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
   * Sets a setting with the given name.
   * @param  {string}  settingName  the name of the setting
   * @param  {Object}  value        the value to be set
   * @return {Promise}              nothing
   */
  async setSetting(settingName, value) {
    const setting = {
      settingName,
      settingValue: value
    };

    await this.insertOrUpdate(setting);
  }

  /**
   * Removes value of the setting.
   * @param  {string}  settingName  the name of the setting
   * @return {Promise}              nothing
   */
  async removeSetting(settingName) {
    const deleteQuery = {
      settingName
    };

    await this.dbManager.dbo.collection(this.getTableName()).deleteOne(deleteQuery);
  }
}

/**
 * Exports the BotMasterTable class
 * @type {BotMasterTable}
 */
module.exports = BotMasterTable;

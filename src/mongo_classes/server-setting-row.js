'use strict';

/**
 * @module server-setting-columns
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotRow = require('./bot-row');

const ServerSettingColumns = Object.freeze({
  source: 'source',
  orgId: 'orgId',
  settingName: 'settingName',
  settingValue: 'settingValue',
});

/**
 * Represents a DB row of a setting defined for a user's server (organization).
 * @see ServerSettingsTable
 * @alias ServerSettingRow
 * @extends BotRow
 */
class ServerSettingRow extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(ServerSettingColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [ServerSettingColumns.source, ServerSettingColumns.orgId, ServerSettingColumns.settingName];
  }
}

/**
 * Exports the ServerSettingRow class
 * @type {ServerSettingRow}
 */
module.exports = ServerSettingRow;

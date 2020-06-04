'use strict';

/**
 * @module user-setting-row
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const UserSettingColumns = Object.freeze({
  source: 'source',
  orgId: 'orgId',
  userId: 'userId',
  settingName: 'settingName',
  settingValue: 'settingValue'
});

/**
 * Represents a DB row of a setting defined for a user in a server.
 * @see UserSettingsTable
 * @alias ServerSettingRow
 * @extends BotRow
 */
class UserSettingRow extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(UserSettingColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [
      UserSettingColumns.source,
      UserSettingColumns.orgId,
      UserSettingColumns.userId,
      UserSettingColumns.settingName
    ];
  }
}

/**
 * Exports the UserSettingRow class
 * @type {UserSettingRow}
 */
module.exports = UserSettingRow;

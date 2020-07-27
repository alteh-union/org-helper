'use strict';

/**
 * @module bot-master-row
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const MasterSettingColumns = Object.freeze({
  settingName: 'settingName',
  settingValue: 'settingValue'
});

/**
 * Represents a DB row of a bot-wide defined setting.
 * @see BotMasterTable
 * @alias BotMasterRow
 * @extends BotRow
 */
class BotMasterRow extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(MasterSettingColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [MasterSettingColumns.settingName];
  }
}

/**
 * Exports the BotMasterRow class
 * @type {BotMasterRow}
 */
module.exports = BotMasterRow;

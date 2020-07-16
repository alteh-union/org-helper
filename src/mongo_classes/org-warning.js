'use strict';

/**
 * @module org-warning
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const WarningColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  userId: 'userId',
  moderatorId: 'moderatorId',
  reason: 'reason',
  timestamp: 'timestamp'
});

/**
 * Represents a DB row of a warning.
 * @see WarningsTable
 * @alias OrgWarning
 * @extends BotRow
 */
class OrgWarning extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(WarningColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [WarningColumns.id, WarningColumns.source, WarningColumns.orgId];
  }
}

/**
 * Exports the OrgWarning class
 * @type {OrgWarning}
 */
module.exports = OrgWarning;

'use strict';

/**
 * @module warnings-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const OrgWarning = require('./org-warning');

const WARNINGS_TABLE_NAME = 'warnings';

/**
 * Represents warnings table. Warnings are issued to users by moderators for misbehavior.
 * If a user gets too many warnings, depending on the server settings, he may face negative
 * consequences, like ban or de-rating.
 * @see OrgWarning
 * @alias WarningsTable
 * @extends BotTable
 */
class WarningsTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get WARNINGS_TABLE_NAME() {
    return WARNINGS_TABLE_NAME;
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgWarning;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgWarning(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return WARNINGS_TABLE_NAME;
  }
}

/**
 * Exports the WarningsTable class
 * @type {WarningsTable}
 */
module.exports = WarningsTable;

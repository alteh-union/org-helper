'use strict';

/**
 * @module orgs-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const OrgRow = require('./org-row');

const ORGS_TABLE_NAME = 'orgs';

/**
 * Represents organizations table.
 * @see OrgChannel
 * @alias ChannelsTable
 * @extends BotTable
 */
class OrgsTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get ORGS_TABLE_NAME() {
    return ORGS_TABLE_NAME;
  }

  /**
   * Inits the instance, creates the collection in the DB, necessary indices, assigns hooks etc.
   * @return {Promise} nothing
   */
  async init() {
    await super.init();
    this.hooks.onDeleteDuringUpdate = this.dbManager.onOrgDeleted;
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgRow;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgRow(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return ORGS_TABLE_NAME;
  }
}

/**
 * Exports the OrgsTable class
 * @type {OrgsTable}
 */
module.exports = OrgsTable;

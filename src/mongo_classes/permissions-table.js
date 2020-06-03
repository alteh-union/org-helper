'use strict';

/**
 * @module permissions-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotTable = require('./bot-table');
const OrgPermission = require('./org-permission');

const PERMISSIONS_TABLE_NAME = 'permissions';

/**
 * Represents permissions table.
 * @see OrgPermission
 * @alias PermissionsTable
 * @extends BotTable
 */
class PermissionsTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get PERMISSIONS_TABLE_NAME() {
    return PERMISSIONS_TABLE_NAME;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(PERMISSIONS_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgPermission;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgPermission(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return PERMISSIONS_TABLE_NAME;
  }
}

/**
 * Exports the PermissionsTable class
 * @type {PermissionsTable}
 */
module.exports = PermissionsTable;

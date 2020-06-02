'use strict';

/**
 * @module roles-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotTable = require('./bot-table');
const OrgRole = require('./org-role');

const ROLES_TABLE_NAME = 'roles';

/**
 * Represents roles table.
 * @see OrgRole
 * @alias RolesTable
 * @extends BotTable
 */
class RolesTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get ROLES_TABLE_NAME() {
    return ROLES_TABLE_NAME;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(ROLES_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgRole;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgRole(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return ROLES_TABLE_NAME;
  }
}

/**
 * Exports the RolesTable class
 * @type {RolesTable}
 */
module.exports = RolesTable;

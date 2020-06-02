'use strict';

/**
 * @module members-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotTable = require('./bot-table');
const OrgMember = require('./org-member');

const MEMBERS_TABLE_NAME = 'members';

/**
 * Represents organization members table.
 * @see OrgMember
 * @alias MembersTable
 * @extends BotTable
 */
class MembersTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get MEMBERS_TABLE_NAME() {
    return MEMBERS_TABLE_NAME;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(MEMBERS_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgMember;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgMember(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return MEMBERS_TABLE_NAME;
  }
}

/**
 * Exports the MembersTable class
 * @type {MembersTable}
 */
module.exports = MembersTable;

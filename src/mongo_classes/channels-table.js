'use strict';

/**
 * @module channels-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const OrgChannel = require('./org-channel');

const CHANNELS_TABLE_NAME = 'channels';

/**
 * Represents channels table.
 * @see OrgChannel
 * @alias ChannelsTable
 * @extends BotTable
 */
class ChannelsTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get CHANNELS_TABLE_NAME() {
    return CHANNELS_TABLE_NAME;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(CHANNELS_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgChannel;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgChannel(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return CHANNELS_TABLE_NAME;
  }
}

/**
 * Exports the ChannelsTable class
 * @type {ChannelsTable}
 */
module.exports = ChannelsTable;

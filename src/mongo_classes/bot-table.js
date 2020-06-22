'use strict';

/**
 * @module bot-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const util = require('util');
const OhUtils = require('../utils/bot-utils');

const DISCORD_SOURCE = 'Discord';
const SLACK_SOURCE = 'Slack';

/**
 * Represents a DB table.
 * @see BotRow
 * @abstract
 * @alias BotTable
 */
class BotTable {
  /**
   * Constructs an instance of the class.
   * @param {DbManager} dbManager the database manager
   */
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.hooks = {};
  }

  /**
   * Gets the string representing Discord as the source of data.
   * @type {String}
   */
  static get DISCORD_SOURCE() {
    return DISCORD_SOURCE;
  }

  /**
   * Gets the string representing Slack as the source of data.
   * @type {String}
   */
  static get SLACK_SOURCE() {
    return SLACK_SOURCE;
  }

  /**
   * Inits the instance, creates the collection in the DB, necessary indices, assigns hooks etc.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(this.getTableName());
    await this.createIndex();
  }

  /**
   * Created necessary indices for the collection.
   * @return {Promise} nothing
   */
  async createIndex() {
    const collection = this.dbManager.dbo.collection(this.getTableName());
    const indexObject = {};
    const keyColumns = this.getRowClass().getKeyColumns();
    for (const column of keyColumns) {
      indexObject[column] = 1;
    }

    await collection.createIndex(indexObject);
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return BotRow;
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    throw new Error('getTableName: ' + this.name + ' is an abstract class.');
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('getRowInstance: ' + this.name + ' is an abstract class.');
  }

  /**
   * Inserts or updates a DB row based on whether the key matches to one of the existing rows.
   * @param  {Object}  entity raw object which values need to be inserted
   * @return {Promise}        nothing
   */
  async insertOrUpdate(entity) {
    const keyColumns = this.getRowClass().getKeyColumns();
    const query = {};
    for (const column of keyColumns) {
      query[column] = entity[column];
    }

    // False positive, the unicorn thinks that "query" is a function here.
    /* eslint-disable unicorn/no-fn-reference-in-iterator */
    const rawRows = await this.dbManager.dbo.collection(this.getTableName()).find(query).toArray();
    /* eslint-enable unicorn/no-fn-reference-in-iterator */
    if (rawRows[0] === undefined) {
      const columns = this.getRowClass().getColumns();
      const insertQuery = {};
      for (const column of columns) {
        insertQuery[column] = entity[column];
      }

      await this.dbManager.dbo.collection(this.getTableName()).insertOne(insertQuery);

      this.dbManager.context.log.i(
        'Table: ' +
          this.getTableName() +
          '; 1 entity inserted: ' +
          util.inspect(insertQuery, { showHidden: true, depth: 1 })
      );
    } else {
      const currentRow = this.getRowInstance(rawRows[0]);
      const updatedRow = this.getRowInstance(entity);

      const updateQuery = currentRow.getKey();
      const valuesToUpdate = currentRow.getValuesToUpdate(updatedRow);

      if (OhUtils.isEmpty(valuesToUpdate)) {
        this.dbManager.context.log.v(
          'Table: ' +
            this.getTableName() +
            '; 1 entity is up to date, id: ' +
            util.inspect(updateQuery, { showHidden: false, depth: 1 }).replace(/[\r\n]+/gm, '')
        );
      } else {
        const newValues = { $set: valuesToUpdate };

        await this.dbManager.dbo.collection(this.getTableName()).updateOne(updateQuery, newValues);
        this.dbManager.context.log.i(
          'Table: ' +
            this.getTableName() +
            '; 1 entity updated, id: ' +
            util.inspect(updateQuery, { showHidden: false, depth: 1 }) +
            '; values: ' +
            util.inspect(newValues, { showHidden: false, depth: 1 })
        );
      }
    }
  }

  /**
   * Gets the current rows existing in the collection.
   * @param  {Object}                 query the query filter object
   * @return {Promise<Array<Object>>}       the array of row objects
   */
  async getRows(query) {
    // False positive, the unicorn thinks that "query" is a function here.
    /* eslint-disable unicorn/no-fn-reference-in-iterator */
    const rawRows = await this.dbManager.dbo.collection(this.getTableName()).find(query).toArray();
    /* eslint-enable unicorn/no-fn-reference-in-iterator */
    const rows = [];
    for (const row of rawRows) {
      rows.push(this.getRowInstance(row));
    }

    return rows;
  }

  /**
   * Gets the current rows existing in the collection, filtered by Discord source and org identifier.
   * @param  {string}  orgId           id of the Discord server (organization)
   * @param  {Object}  additionalQuery the query filter object
   * @return {Promise}                 the array of row objects
   */
  async getCurrentDiscordRows(orgId, additionalQuery) {
    let query = additionalQuery;
    if (query === undefined || query === null) {
      query = {};
    }

    query.source = BotTable.DISCORD_SOURCE;
    if (orgId !== undefined && orgId !== null) {
      query.orgId = orgId;
    }

    // False positive, the unicorn thinks that "query" is a function here.
    /* eslint-disable unicorn/no-fn-reference-in-iterator */
    const rawRows = await this.dbManager.dbo.collection(this.getTableName()).find(query).toArray();
    /* eslint-enable unicorn/no-fn-reference-in-iterator */
    const discordRows = [];
    for (const row of rawRows) {
      discordRows.push(this.getRowInstance(row));
    }

    return discordRows;
  }

  /**
   * Deletes rows related to Discord and to a given organization, with applied filter query.
   * @param  {string}  orgId           id of the Discord server (organization)
   * @param  {Object}  additionalQuery the query filter object
   * @return {Promise}                 nothing
   */
  async deleteDiscordRows(orgId, additionalQuery) {
    await this.deleteRows(BotTable.DISCORD_SOURCE, orgId, additionalQuery);
  }

  /**
   * Deletes rows related to a given source and to a given organization, with applied filter query.
   * @param  {string}  source          the source of the data (like Discord etc.)
   * @param  {string}  orgId           id of the Discord server (organization)
   * @param  {Object}  additionalQuery the query filter object
   * @return {Promise}                 nothing
   */
  async deleteRows(source, orgId, additionalQuery) {
    let query = additionalQuery;
    if (query === undefined || query === null) {
      query = {};
    }

    if (source !== undefined && source !== null) {
      query.source = source;
    }

    if (orgId !== undefined && orgId !== null) {
      query.orgId = orgId;
    }

    this.dbManager.context.log.v('deleteRows, query: ' + util.inspect(query, { showHidden: true, depth: 3 }));
    await this.dbManager.dbo.collection(this.getTableName()).remove(query);
  }

  /**
   * Inserts, updates and deletes rows in the DB based on the actual information about the Discord guild.
   * @param  {Collection}  discordCollection the collection of Discord objects (roles, members etc.)
   * @param  {Guild}       guild             the Discord guild object
   * @return {Promise}                       nothing
   */
  async updateFromDiscord(discordCollection, guild) {
    const currentRows = await this.getCurrentDiscordRows(guild === undefined ? undefined : guild.id);

    const foundIndices = [];

    discordCollection.each(async entity => {
      const rowFromDiscord = this.getRowClass().createFromDiscordEntity(entity, guild);

      let foundIndex = -1;
      for (const [i, row] of currentRows.entries()) {
        if (row.equalsByKey(rowFromDiscord)) {
          foundIndex = i;
          foundIndices.push(i);
          break;
        }
      }

      if (foundIndex >= 0) {
        const updateQuery = currentRows[foundIndex].getKey();
        const valuesToUpdate = currentRows[foundIndex].getValuesToUpdate(rowFromDiscord);

        if (!OhUtils.isEmpty(valuesToUpdate)) {
          const newValues = { $set: valuesToUpdate };

          await this.dbManager.dbo.collection(this.getTableName()).updateOne(updateQuery, newValues);
          this.dbManager.context.log.i(
            'Table: ' +
              this.getTableName() +
              '; 1 entity updated, id: ' +
              util.inspect(updateQuery, { showHidden: false, depth: 1 }) +
              '; values: ' +
              util.inspect(newValues, { showHidden: false, depth: 1 })
          );

          if (this.hooks.onUpdateDuringUpdate !== undefined) {
            await this.hooks.onUpdateDuringUpdate(this.dbManager, updateQuery);
          }
        }
      } else {
        await this.dbManager.dbo.collection(this.getTableName()).insertOne(rowFromDiscord);

        if (this.hooks.onInsertDuringUpdate !== undefined) {
          this.hooks.onInsertDuringUpdate(this.dbManager, rowFromDiscord);
        }

        this.dbManager.context.log.i(
          'Table: ' +
            this.getTableName() +
            '; 1 entity inserted: ' +
            util.inspect(rowFromDiscord, { showHidden: true, depth: 1 })
        );
      }
    });

    const toDelete = currentRows.filter((value, index) => {
      return !foundIndices.includes(index);
    });

    if (toDelete.length > 0) {
      const toDeleteArray = [];
      for (const element of toDelete) {
        const keyObject = element.getKey();
        const entityArray = [];
        for (const keyField of Object.keys(keyObject)) {
          const keyFieldObject = {};
          keyFieldObject[keyField] = keyObject[keyField];
          entityArray.push(keyFieldObject);
        }

        toDeleteArray.push({ $and: entityArray });

        this.dbManager.context.log.i(
          'Table: ' +
            this.getTableName() +
            '; 1 entity to be deleted, id: ' +
            util.inspect(element, { showHidden: false, depth: 1 })
        );
      }

      await this.dbManager.dbo.collection(this.getTableName()).deleteMany({ $or: toDeleteArray });

      for (const element of toDelete) {
        if (this.hooks.onDeleteDuringUpdate !== undefined) {
          await this.hooks.onDeleteDuringUpdate(this.dbManager, element);
        }
      }
    }
  }
}

/**
 * Exports the BotTable class
 * @type {BotTable}
 */
module.exports = BotTable;

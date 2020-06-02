'use strict';

/**
 * @module tasks-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotTable = require('./bot-table');
const OrgTask = require('./org-task');

const TASKS_TABLE_NAME = 'tasks';

/**
 * Represents table of tasks to be scheduled and executed.
 * @see OrgTask
 * @alias TasksTable
 * @extends BotTable
 */
class TasksTable extends BotTable {
  /**
   * This table's name.
   * @type {string}
   */
  static get TASKS_TABLE_NAME() {
    return TASKS_TABLE_NAME;
  }

  /**
   * Inits the instance, creates the collection in the DB and necessary indices.
   * @return {Promise} nothing
   */
  async init() {
    await this.dbManager.dbo.createCollection(TASKS_TABLE_NAME);
    await this.createIndex();
  }

  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return OrgTask;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new OrgTask(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return TASKS_TABLE_NAME;
  }
}

/**
 * Exports the TasksTable class
 * @type {TasksTable}
 */
module.exports = TasksTable;

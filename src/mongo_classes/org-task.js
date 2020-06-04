'use strict';

/**
 * @module org-task
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const TasksColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  type: 'type',
  time: 'time',
  content: 'content'
});

const TasksTypes = Object.freeze({
  reminder: 'reminder'
});

/**
 * Represents a DB row of a task to be scheduled and executed.
 * @see TasksTable
 * @alias OrgTask
 * @extends BotRow
 */
class OrgTask extends BotRow {
  /**
   * Gets all defined columns of the class.
   * @type {Array<Object>}
   */
  static get COLUMNS() {
    return TasksColumns;
  }

  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(TasksColumns);
  }

  /**
   * Gets task types defined in the DB.
   * @type {Array<Object>}
   */
  static get TASK_TYPES() {
    return TasksTypes;
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [TasksColumns.id, TasksColumns.source, TasksColumns.orgId];
  }

  /**
   * Converts TimeArg into the time object for storing in the DB (containing time definitions only)
   * @param  {TimeArg} timeArg the time argument
   * @return {Object}          the object to be stored in the DB
   */
  static parseTimeArg(timeArg) {
    return { definitions: timeArg.convertDistanceToSchedule().definitions };
  }
}

/**
 * Exports the OrgTask class
 * @type {OrgTask}
 */
module.exports = OrgTask;

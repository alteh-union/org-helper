'use strict';

/**
 * @module bot-row
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

/**
 * Represents a DB row.
 * @see BotTable
 * @abstract
 * @alias BotRow
 */
class BotRow {
  /**
   * Constructs an instance of the class
   * @param {Object} dbObj the DB object to construct this instance from
   */
  constructor(dbObject) {
    this.createFromDbObj(dbObject);
  }

  /**
   * Creates instance of the class using a raw object from the database.
   * @param  {Object} dbObj the DB object to construct this instance from
   */
  createFromDbObj(dbObject) {
    const columns = this.constructor.getColumns();
    for (const column of columns) {
      this[column] = dbObject[column];
    }
  }

  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    throw new Error('getColumns: ' + this.name + ' is an abstract class');
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    throw new Error('getKeyColumns: ' + this.name + ' is an abstract class');
  }

  /**
   * Gets non-key defined columns of the DB row.
   * @return {Array<string>} the array of non-key column names
   */
  static getNonKeyColumns() {
    const allColumns = this.getColumns();
    const keyColumns = this.getKeyColumns();
    return allColumns.filter(value => {
      return !keyColumns.includes(value);
    });
  }

  /**
   * Creates an instance based on a Discord entity
   * @param  {Guild}  discordGuild  the Discord guild which the object belongs to
   * @param  {Object} discordEntity the Discord object to create instance from
   * @return {Object}               the instance created
   */
  static createFromDiscordEntity(discordGuild, discordEntity) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('createFromDiscordEntity: ' + this.name + ' is an abstract class');
  }

  /**
   * Gets the keys of the row instance.
   * @return {Object} the object containing key values of the row object
   */
  getKey() {
    const keyColumns = this.constructor.getKeyColumns();
    const key = {};
    for (const column of keyColumns) {
      key[column] = this[column];
    }

    return key;
  }

  /**
   * Gets the values to be updated from another object (considered are more "recent").
   * Counts only non-key columns, since if keys are different, then it's a different entity and should
   * be saved in a different row, not updated.
   * @param  {Object} anotherRow another object to compare values with
   * @return {Object}            object containing key-value pairs to update
   */
  getValuesToUpdate(anotherRow) {
    const columns = this.constructor.getNonKeyColumns();
    const valuesToUpdate = {};
    for (const column of columns) {
      if (this[column] !== anotherRow[column]) {
        valuesToUpdate[column] = anotherRow[column];
      }
    }

    return valuesToUpdate;
  }

  /**
   * Checks if the two objects are matching by the key values.
   * @param  {Object}  anotherRow another object to compare key with
   * @return {Boolean}            true if the objects are equal, false otherwise
   */
  equalsByKey(anotherRow) {
    const keyColumns = this.constructor.getKeyColumns();
    for (const column of keyColumns) {
      if (this[column] !== anotherRow[column]) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Exports the BotRow class
 * @type {BotRow}
 */
module.exports = BotRow;

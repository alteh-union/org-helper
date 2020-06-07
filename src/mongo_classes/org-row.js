'use strict';

/**
 * @module org-row
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const BotRow = require('./bot-row');

const OrgColumns = Object.freeze({
  id: 'id',
  source: 'source',
  name: 'name'
});

/**
 * Represents a DB row of a organization (like Discord guild).
 * @see OrgsTable
 * @alias OrgRow
 * @extends BotRow
 */
class OrgRow extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(OrgColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [OrgColumns.id, OrgColumns.source];
  }

  /**
   * Creates an instance based on a Discord entity.
   * @see BotTable#updateFromDiscord
   * @param  {Object} discordEntity the Discord object to create instance from
   * @return {Object}               the instance created
   */
  static createFromDiscordEntity(discordEntity) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */

    // Here we ignore the second guild arg, since it will be undefined on calling BotTable#updateFromDiscord
    // while updating the list of guilds. discordEntity arg will contain the particular Discord guild object instead.
    const dbObject = {
      id: discordEntity.id,
      source: BotTable.DISCORD_SOURCE,
      name: discordEntity.name
    };
    return new OrgRow(dbObject);
  }
}

/**
 * Exports the OrgRow class
 * @type {OrgRow}
 */
module.exports = OrgRow;

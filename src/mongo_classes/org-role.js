'use strict';

/**
 * @module org-role
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotTable = require('./bot-table');
const BotRow = require('./bot-row');

const RoleColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  name: 'name',
});

/**
 * Represents a DB row of a role.
 * @see RolesTable
 * @alias OrgRole
 * @extends BotRow
 */
class OrgRole extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(RoleColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [RoleColumns.id, RoleColumns.source, RoleColumns.orgId];
  }

  /**
   * Creates an instance based on a Discord entity
   * @param  {Guild}  discordGuild  the Discord guild which the object belongs to
   * @param  {Object} discordEntity the Discord object to create instance from
   * @return {Object}               the instance created
   */
  static createFromDiscordEntity(discordGuild, discordEntity) {
    const dbObject = {
      id: discordEntity.id,
      source: BotTable.DISCORD_SOURCE,
      orgId: discordGuild.id,
      name: discordEntity.name,
    };
    return new OrgRole(dbObject);
  }
}

/**
 * Exports the OrgRole class
 * @type {OrgRole}
 */
module.exports = OrgRole;

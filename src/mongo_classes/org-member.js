'use strict';

/**
 * @module org-member
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const DiscordUtils = require('../utils/discord-utils');

const BotTable = require('./bot-table');
const BotRow = require('./bot-row');

const MemberColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  displayName: 'displayName',
  userName: 'userName',
});

/**
 * Represents a DB row of an organization member.
 * @see MembersTable
 * @alias OrgMember
 * @extends BotRow
 */
class OrgMember extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(MemberColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [MemberColumns.id, MemberColumns.source, MemberColumns.orgId];
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
      displayName: discordEntity.displayName,
      userName: DiscordUtils.getDiscordUserName(
        discordEntity.user.username,
        discordEntity.user.discriminator.toString()
      ),
    };
    return new OrgMember(dbObject);
  }
}

/**
 * Exports the OrgMember class
 * @type {OrgMember}
 */
module.exports = OrgMember;

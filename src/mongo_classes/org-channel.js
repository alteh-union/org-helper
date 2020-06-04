'use strict';

/**
 * @module org-channel
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const BotRow = require('./bot-row');

const TEXT_TYPE = 'text';
const VOICE_TYPE = 'voice';

const ChannelColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  name: 'name',
  type: 'type'
});

/**
 * Represents a DB row of a channel.
 * @see ChannelsTable
 * @alias OrgChannel
 * @extends BotRow
 */
class OrgChannel extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(ChannelColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [ChannelColumns.id, ChannelColumns.source, ChannelColumns.orgId];
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
      type: discordEntity.type
    };
    return new OrgChannel(dbObject);
  }

  /**
   * Checks if the channel type is text type (according to DB predefined values)
   * @param  {string}   type the name of the text channel type
   * @return {Boolean}       true if equal to text type, false otherwise
   */
  isTextType(type) {
    return type === TEXT_TYPE;
  }

  /**
   * Checks if the channel type is voice type (according to DB predefined values)
   * @param  {string}   type the name of the voice channel type
   * @return {Boolean}       true if equal to voice type, false otherwise
   */
  isVoiceType(type) {
    return type === VOICE_TYPE;
  }

  /**
   * Gets the string representing the text channel type.
   * @return {string} the text type string
   */
  static getTextType() {
    return TEXT_TYPE;
  }

  /**
   * Gets the string representing the voice channel type.
   * @return {string} the voice type string
   */
  static getVoiceType() {
    return VOICE_TYPE;
  }
}

/**
 * Exports the OrgChannel class
 * @type {OrgChannel}
 */
module.exports = OrgChannel;

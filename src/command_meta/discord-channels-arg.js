'use strict';

/**
 * @module siscord-channels-arg
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OrgChannel = require('../mongo_classes/org-channel');

/**
 * Command's argument object representing an array of Discord channel ids.
 * @alias DiscordChannelsArg
 */
class DiscordChannelsArg {
  /**
   * Constructs an instance of the class.
   * @param {Array<string>} channels the array of channel ids
   */
  constructor(channels) {
    // Removes duplicates.
    this.channels = Array.from(new Set(channels));
  }

  /**
   * Validates that all given channels are existing for the organization and have a proper type (text, voice etc.).
   * @see OrgChannel
   * @param  {Context}          context     the Bot's context
   * @param  {string}           orgId       the organization identifier
   * @param  {string}           channelType the channel type
   * @return {Promise<Boolean>}             true if the validation passed
   */
  async validateDiscordChannelsArg(context, orgId, channelType) {
    if (this.channels.length === 0) {
      return false;
    }

    const guild = context.discordClient.guilds.cache.get(orgId);
    if (guild === undefined) {
      return false;
    }

    const filteredChannels = guild.channels.cache.filter(
      channel => this.channels.includes(channel.id) &&
      (channelType !== undefined || channel.type === channelType));

    return filteredChannels.size !== this.channels.length;
  }

  /**
   * Validates that all given text channels are existing for the organization.
   * @see OrgChannel
   * @param  {Context}          context     the Bot's context
   * @param  {string}           orgId       the organization identifier
   * @return {Promise<Boolean>}             true if the validation passed
   */
  async validateDiscordTextChannelsArg(context, orgId) {
    return this.validateDiscordChannelsArg(context, orgId, OrgChannel.getTextType());
  }

  /**
   * Validates that all given voice channels are existing for the organization.
   * @see OrgChannel
   * @param  {Context}          context     the Bot's context
   * @param  {string}           orgId       the organization identifier
   * @return {Promise<Boolean>}             true if the validation passed
   */
  async validateDiscordVoiceChannelsArg(context, orgId) {
    return this.validateDiscordChannelsArg(context, orgId, OrgChannel.getVoiceType());
  }

  /**
   * Checks if the argument has no channel ids in it
   * @return {Boolean} true if the argument has no channel ids
   */
  isEmpty() {
    return this.channels.length === 0;
  }

  /**
   * Converts the ids array to string
   * @return {string} the result string
   */
  toString() {
    return this.channels.join(', ');
  }
}

/**
 * Exports the DiscordChannelsArg class
 * @type {DiscordChannelsArg}
 */
module.exports = DiscordChannelsArg;

'use strict';

/**
 * @module discord-source
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordUtils = require('../utils/discord-utils');
const BaseSource = require('./base-source');
const BotTable = require('../mongo_classes/bot-table');
const DiscordCommandManager = require('../components/discord-command-manager');

/**
 * Represents the Discord source
 * @alias DiscordSource
 * @extends BaseSource
 */
class DiscordSource extends BaseSource {
  /**
   * Creates the instance using the Discord client object
   * @param {Object} client the client object
   */
  constructor(client) {
    super(client);
    this.commandManager = new DiscordCommandManager();
  }

  /**
   * Replies to the message using a source-dependent class
   * @param   {BaseMessage} message   the base message object
   * @param   {string}      replyText the text to reply with
   * @returns {Promise}               nothing
   */
  async replyToMessage(message, replyText) {
    DiscordUtils.sendToTextChannel(message.originalMessage.channel, replyText);
  }

  /**
   * Gets the name of the source
   * @return {string} the name
   */
  get name() {
    return BotTable.DISCORD_SOURCE;
  }
}

/**
 * Exports the DiscordSource class
 * @type {DiscordSource}
 */
module.exports = DiscordSource;

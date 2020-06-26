'use strict';

const DiscordUtils = require('../utils/discord-utils');
const BaseSource = require('./base-source');
const BotTable = require('../mongo_classes/bot-table');
const DiscordCommandManager = require('../components/discord-command-manager');

/**
 * Discord source
 */
class DiscordSource extends BaseSource {
  constructor(client) {
    super(client);
    this.commandManager = new DiscordCommandManager();
  }

  /**
   * Reply to the message using the source
   * @param message
   * @param replyText
   * @returns {Promise<void>}
   */
  async replyToMessage(message, replyText) {
    DiscordUtils.sendToTextChannel(message.originalMessage.channel, replyText);
  }

  /**
   * String name of the source
   */
  get name() {
    return BotTable.DISCORD_SOURCE;
  }
}

module.exports = DiscordSource;

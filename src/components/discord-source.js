'use strict';

const DiscordUtils = require('../utils/discord-utils');
const BaseSource = require('./base-source');
const BotTable = require('../mongo_classes/bot-table');

class DiscordSource extends BaseSource {
  async replyToMessage(message, replyText) {
    DiscordUtils.sendToTextChannel(message.originalMessage.channel, replyText);
  }

  get name() {
    return BotTable.DISCORD_SOURCE;
  }
}

module.exports = DiscordSource;

'use strict';

const DiscordUtils = require('../utils/discord-utils');
const BaseSource = require('./base-source');

class DiscordSource extends BaseSource {
  async replyToMessage(message, replyText) {
    DiscordUtils.sendToTextChannel(message.originalMessage.channel, replyText);
  }
}

module.exports = DiscordSource;

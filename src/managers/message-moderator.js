'use strict';

/**
 * @module message-moderator
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');
const DiscordUtils = require('../utils/discord-utils');

const ArrayArgScanner = require('../arg_scanners/array-arg-scanner');

const BotTable = require('../mongo_classes/bot-table');
const ServerSettingsTable = require('../mongo_classes/server-settings-table');

/**
 * Handles non-command incoming messages.
 * @alias MessageModerator
 */
class MessageModerator {
  /**
   * Constructs an instance of the class
   * @param {Context} context the Bot's context
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Sets the Discord client for the instance.
   * @param {Client} client the Dicord client
   */
  setDiscordClient(client) {
    this.discordClient = client;
  }

  /**
   * Premoderates incoming message (e.g. replaces bad words etc.)
   * @param  {BaseMessage}  message the Discordmessage
   * @return {Promise}                 nothing
   */
  async premoderateDiscordMessage(message) {
    const censoringEnabled = await this.context.dbManager.getSetting(
      BotTable.DISCORD_SOURCE,
      message.teamId,
      ServerSettingsTable.SERVER_SETTINGS.censoring.name,
      OhUtils.OFF
    );

    if (censoringEnabled === OhUtils.ON) {
      const badWordsString = await this.context.dbManager.getSetting(
        BotTable.DISCORD_SOURCE,
        message.teamId,
        ServerSettingsTable.SERVER_SETTINGS.badwords.name,
        ''
      );

      if (badWordsString.length > 0) {
        const badWords = badWordsString.split(ArrayArgScanner.ARRAY_SEPARATOR);
        let content = message.content.slice(0);
        for (const badWord of badWords) {
          const euphemism = OhUtils.makeEuphemism(badWord.length);
          const re = new RegExp(badWord, 'gi');

          content = content.replace(re, euphemism);
        }

        if (content !== message.content) {
          await message.reply(this.context.langManager.getString(
            'moderator_censored_message',
            DiscordUtils.makeUserMention(message.originalMessage.member.id),
            content
          ));
          await message.originalMessage.delete();
        }
      }
    }
  }
}

/**
 * Exports the MessageModerator class
 * @type {MessageModerator}
 */
module.exports = MessageModerator;

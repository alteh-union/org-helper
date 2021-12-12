'use strict';

/**
 * @module discord-source
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordUtils = require('../utils/discord-utils');
const OhUtils = require('../utils/bot-utils');
const BaseSource = require('./base-source');
const BotTable = require('../mongo_classes/bot-table');
const DiscordCommandManager = require('./discord-command-manager');

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
    if (message.originalMessage && message.originalMessage.channel) {
      DiscordUtils.sendToTextChannel(message.originalMessage.channel, replyText);
    } else {
      message.replyResult.text += replyText;
    }
  }

  /**
   * Replies to the message using a source-dependent class and attaches the given picture to it
   * @param   {BaseMessage} message   the base message object
   * @param   {string}      filePath  the path to the local photo file
   * @returns {Promise}               nothing
   */
  async replyWithPhoto(message, filePath) {
    await message.originalMessage.channel.send(null, {
      files: [filePath]
    });
  }

  /**
   * Makes a string representing a user mention in a format which can be used by a native client of the source.
   * @param   {BaseMessage}     message   the base message object
   * @param   {string}          userId    the identifier of the user to be mentioned
   * @returns {Promise<string>}           nothing
   */
  async makeUserMention(message, userId) {
    return DiscordUtils.makeUserMention(userId);
  }

  /**
   * Makes a string representing a user mention in a format which can be used by a native client of the source.
   * @param   {BaseMessage}     message   the base message object
   * @param   {string}          userId    the identifier of the user to be mentioned
   * @returns {Promise<string>}           nothing
   */
  async readTextAttachment(message, extensions, log) {
    const discordMessage = message.originalMessage;
    if (discordMessage.attachments) {
      let attachmentText = null;
      for (const attachment of discordMessage.attachments.values()) {
        attachmentText = await OhUtils.getAttachmentText(attachment.name, attachment.attachment, extensions, log);
        if (attachmentText !== null) {
          break;
        }
      }
      return attachmentText;
    } else {
      return null;
    }
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

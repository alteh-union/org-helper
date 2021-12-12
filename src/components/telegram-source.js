'use strict';

/**
 * @module telegram-source
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const fs = require('fs');

const OhUtils = require('../utils/bot-utils');
const TelegramUtils = require('../utils/telegram-utils');
const BaseSource = require('./base-source');
const BotTable = require('../mongo_classes/bot-table');
const TelegramCommandManager = require('./telegram-command-manager');

const DEFAULT_COMMAND_PREFIX = '/';

/**
 * Represents the Telegram source
 * @alias TelegramSource
 * @extends BaseSource
 */
class TelegramSource extends BaseSource {
  /**
   * Creates the instance using the Telegram client object
   * @param {Object} client the client object
   */
  constructor(client) {
    super(client);
    this.commandManager = new TelegramCommandManager();
  }

  /**
   * Replies to the message using a source-dependent class
   * @param   {BaseMessage} message   the base message object
   * @param   {string}      replyText the text to reply with
   * @returns {Promise}               nothing
   */
  async replyToMessage(message, replyText) {
    await TelegramUtils.replyToMessage(message.originalMessage, replyText);
  }

  /**
   * Replies to the message using a source-dependent class and attaches the given picture to it
   * @param   {BaseMessage} message   the base message object
   * @param   {string}      filePath  the path to the local photo file
   * @returns {Promise}               nothing
   */
  async replyWithPhoto(message, filePath) {
    await message.originalMessage.replyWithPhoto({ source: fs.readFileSync(filePath) });
  }

  /**
   * Makes a string representing a user mention in a format which can be used by a native client of the source.
   * @param   {BaseMessage}     message   the base message object
   * @param   {string}          userId    the identifier of the user to be mentioned
   * @returns {Promise<string>}           nothing
   */
  async makeUserMention(message, userId) {
    const userInfo = await this.client.telegram.getChatMember(message.orgId, userId);
    return TelegramUtils.makeUserMention(userInfo.user.username);
  }

  /**
   * Makes a string representing a user mention in a format which can be used by a native client of the source.
   * @param   {BaseMessage}     message   the base message object
   * @param   {string}          userId    the identifier of the user to be mentioned
   * @returns {Promise<string>}           nothing
   */
  async readTextAttachment(message, extensions, log) {
    const telegramContext = message.originalMessage;
    if (telegramContext.message.document) {
      const link = await telegramContext.telegram.getFileLink(telegramContext.message.document.file_id);
      return await OhUtils.getAttachmentText(telegramContext.message.document.file_name, link.href, extensions, log);
    } else {
      return null;
    }
  }

  /**
   * Gets the name of the source
   * @return {string} the name
   */
  get name() {
    return BotTable.TELEGRAM_SOURCE;
  }

  /**
   * Gets the default command prefix to be recognized by the bot.
   * @return {string} the prefix
   */
  get DEFAULT_COMMAND_PREFIX() {
    return DEFAULT_COMMAND_PREFIX;
  }
}

/**
 * Exports the TelegramSource class
 * @type {TelegramSource}
 */
module.exports = TelegramSource;

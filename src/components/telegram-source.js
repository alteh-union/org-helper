'use strict';

/**
 * @module telegram-source
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TelegramUtils = require('../utils/telegram-utils');
const BaseSource = require('./base-source');
const BotTable = require('../mongo_classes/bot-table');
const TelegramCommandManager = require('./telegram-command-manager');

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
   * Gets the name of the source
   * @return {string} the name
   */
  get name() {
    return BotTable.TELEGRAM_SOURCE;
  }
}

/**
 * Exports the TelegramSource class
 * @type {TelegramSource}
 */
module.exports = TelegramSource;

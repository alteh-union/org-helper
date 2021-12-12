'use strict';

/**
 * @module telegram-utils
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const MaxTextLength = 4096;

const TelegramUserPrefix = '@';

const ChatTypes = Object.freeze({
  private: "private"
});

/**
 * Various utils related to Telegram.
 * @alias TelegramUtils
 */
class TelegramUtils {
  /**
   * The possible types of Telegram chats.
   * @type {Object}
   */
  static get CHAT_TYPES() {
    return ChatTypes;
  }

  /**
   * Makes a string mentioning a user, to be used in Telegram messages
   * @param  {string} userName the Telegram client to fetch the user name by its id
   * @return {string}          the mention string
   */
  static makeUserMention(userName) {
    return TelegramUserPrefix + userName;
  }

  /**
   * Sends a message as a response to another Telegram message, considering the hard limit of symbols to be posted.
   * If the length is more than the limits, splits the message into several, if possible - at the line end
   * closest to the limit.
   * @param  {Object}    originalMessage the context of message to reply to
   * @param  {string}    text            the text to be posted
   * @return {Promise}                   nothing
   */
  static async replyToMessage(originalMessage, text) {
    let remainingText = text;
    while (remainingText.length > MaxTextLength) {
      let nextPart = remainingText.slice(0, Math.max(0, MaxTextLength));
      const lastLineSymbol = nextPart.lastIndexOf('\n');
      if (lastLineSymbol >= 0) {
        nextPart = nextPart.slice(0, Math.max(0, lastLineSymbol));
        remainingText = remainingText.slice(Math.max(0, lastLineSymbol + 1));
      } else {
        remainingText = remainingText.slice(Math.max(0, MaxTextLength));
      }

      // Must preserve the order of messages, so ignoring the warning about parallel processing.
      /* eslint-disable no-await-in-loop */
      await originalMessage.reply(nextPart);
      /* eslint-enable no-await-in-loop */
    }

    await originalMessage.reply(remainingText);
  }
}

/**
 * Exports the TelegramUtils class
 * @type {TelegramUtils}
 */
module.exports = TelegramUtils;

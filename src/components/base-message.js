'use strict';

/**
 * @module base-message
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Wrapper for a source-specific message
 * @alias BaseMessage
 */
class BaseMessage {
  /**
   * Creates a base (source-independent) message from source-specific message
   * @param {string}     orgId           the organization id where the message was posted
   * @param {string}     channelId       the channel id where the message was posted
   * @param {string}     userId          the author id as text
   * @param {string}     content         the text content of the message
   * @param {Object}     originalMessage the original source-dependent message
   * @param {BaseSource} source          the source class of the message
   */
  constructor(orgId, channelId, userId, content, originalMessage, source) {
    this.orgId = orgId;
    this.channelId = channelId;
    this.userId = userId;
    this.content = content;
    this.originalMessage = originalMessage;
    this.source = source;
    this.replyResult = { text: '', attachments: [], suggestions: [] };
  }

  /**
   * Create BaseMessage from a Slack message
   * @param   {Object}      slackMessage the Slack native message object
   * @param   {Object}      slackSource  the Slack source object
   * @returns {BaseMessage}              the result source-independent message
   */
  static createFromSlack(slackMessage, slackSource) {
    return new BaseMessage(
      slackMessage.team_id,
      slackMessage.channel,
      slackMessage.user,
      slackMessage.text,
      slackMessage,
      slackSource
    );
  }

  /**
   * Create BaseMessage from a Discord message
   * @param   {Object}      discordMessage the Discord native message object
   * @param   {Object}      discordSource  the Discord source object
   * @returns {BaseMessage}                the result source-independent message
   */
  static createFromDiscord(discordMessage, discordSource) {
    return new BaseMessage(
      discordMessage.guild ? discordMessage.guild.id : null,
      discordMessage.channel ? discordMessage.channel.id : null,
      discordMessage.author ? discordMessage.author.id : null,
      discordMessage.content,
      discordMessage,
      discordSource
    );
  }

  /**
   * Create BaseMessage from a Telegram context (as a result of receiving a message)
   * @param   {Object}      telegramContext the Telegram native context object
   * @param   {Object}      telegramSource  the Telegram source object
   * @returns {BaseMessage}                 the result source-independent message
   */
  static createFromTelegram(telegramContext, telegramSource) {
    return new BaseMessage(
      telegramContext.message.chat.id ? telegramContext.message.chat.id : null,
      null,
      telegramContext.message.from.id ? telegramContext.from.id : null,
      telegramContext.message.text,
      telegramContext,
      telegramSource
    );
  }

  /**
   * Replies to the message with a text using the respective source-dependent class.
   * The source-dependent function called from here should take care of technical nuances of the respective
   * platform (for example, that Discord does not allow to send messages with more than 2000 symbols at a time).
   * @param   {string}  text the text to reply with
   * @returns {Promise}      nothing
   */
  async reply(text) {
    this.source.replyToMessage(this, text);
  }
}

/**
 * Exports the BaseMessage class
 * @type {BaseMessage}
 */
module.exports = BaseMessage;

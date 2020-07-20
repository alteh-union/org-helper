'use strict';

/**
 * @module discord-utils
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const DiscordMentionStart = '<';
const DiscordMentionEnd = '>';
const DiscordChannelPrefix = '#';
const DiscordSubjectPrefix = '@';
const DiscordSubjectIdPrefix = '!';
const DiscordSubjectRolePrefix = '&';
const DiscordDiscriminatorSeparator = '#';

const MaxTextLength = 2000;

/**
 * Various utils related to Discord.
 * @alias DiscordUtils
 */
class DiscordUtils {
  /**
   * The start symbol of the Discord mention
   * @type {string}
   */
  static get DISCORD_MENTION_START() {
    return DiscordMentionStart;
  }

  /**
   * The end symbol of the Discord mention
   * @type {string}
   */
  static get DISCORD_MENTION_END() {
    return DiscordMentionEnd;
  }

  /**
   * The symbol of the Discord mention indicating it's a channel
   * @type {string}
   */
  static get DISCORD_CHANNEL_PREFIX() {
    return DiscordChannelPrefix;
  }

  /**
   * The symbol of the Discord mention indicating it's a subject
   * @type {string}
   */
  static get DISCORD_SUBJECT_PREFIX() {
    return DiscordSubjectPrefix;
  }

  /**
   * The symbol of the Discord mention indicating it's a user
   * @type {string}
   */
  static get DISCORD_SUBJECT_ID_PREFIX() {
    return DiscordSubjectIdPrefix;
  }

  /**
   * The symbol of the Discord mention indicating it's a role
   * @type {string}
   */
  static get DISCORD_SUBJECT_ROLE_PREFIX() {
    return DiscordSubjectRolePrefix;
  }

  /**
   * Makes a string mentioning a user, to be used in Discord messages
   * @param  {string} userId the id of the Discord user
   * @return {string}        the mention string
   */
  static makeUserMention(userId) {
    return DiscordMentionStart + DiscordSubjectPrefix + DiscordSubjectIdPrefix + userId + DiscordMentionEnd;
  }

  /**
   * Makes a string mentioning a role, to be used in Discord messages
   * @param  {string} userId the id of the Discord user
   * @return {string}        the mention string
   */
  static makeRoleMention(roleId) {
    return DiscordMentionStart + DiscordSubjectPrefix + DiscordSubjectRolePrefix + roleId + DiscordMentionEnd;
  }

  /**
   * Makes a string mentioning a channel, to be used in Discord messages
   * @param  {string} userId the id of the Discord user
   * @return {string}        the mention string
   */
  static makeChannelMention(channelId) {
    return DiscordMentionStart + DiscordChannelPrefix + channelId + DiscordMentionEnd;
  }

  /**
   * Gets the full Discord user name by appending the discriminator to the display name.
   * @param  {string} usernameString the user name
   * @param  {number} discriminator  the discriminator id
   * @return {string}                the full discriminated user name
   */
  static getDiscordUserName(usernameString, discriminator) {
    return usernameString + DiscordDiscriminatorSeparator + discriminator.toString();
  }

  /**
   * Sends a message to Discord channel, considering the hard limit of symbols to be posted.
   * If the length is more than the limits, splits the message into several, if possible - at the line end
   * closest to the limit.
   * @param  {Channel}  discordChannel the Discord text channel
   * @param  {string}   text           the text to be posted
   * @return {Promise}                 nothing
   */
  static async sendToTextChannel(discordChannel, text) {
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
      await discordChannel.send(nextPart);
      /* eslint-enable no-await-in-loop */
    }

    await discordChannel.send(remainingText);
  }

  /**
   * Tries to read an attachment as text. Returns null if failed.
   * @param  {Object}        messageAttachment the attachment object
   * @param  {Array<string>} allowedExtensions the array of allowed extensions. Empty element allows file w/o extension
   * @param  {Log}           log               the log object to save the error info
   * @return {string}                          the result string or null if failed
   */
  static async getAttachmentText(messageAttachment, allowedExtensions, log) {
    if (allowedExtensions === undefined || allowedExtensions === null || allowedExtensions.length === 0) {
      allowedExtensions = [];
      allowedExtensions.push('');
    }

    const extension = messageAttachment.name === null ? null :
      messageAttachment.name.slice(messageAttachment.name.lastIndexOf('.') + 1);
    if (!allowedExtensions.includes('') && !allowedExtensions.includes(extension.toLowerCase())) {
      return null;
    }

    const result = await OhUtils.downloadPage(messageAttachment.attachment);
    if (result instanceof Error) {
      log.e('getAttachmentText download error: ' + result.message + '; stack: ' + result.stack);
      return null;
    } else {
      return result;
    }
  }
}

/**
 * Exports the DiscordUtils class
 * @type {DiscordUtils}
 */
module.exports = DiscordUtils;

'use strict';

/**
 * @module discord-utils
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordMentionStart = '<';
const DiscordMentionEnd = '>';
const DiscordChannelPrefix = '#';
const DiscordSubjectPrefix = '@';
const DiscordSubjectIdPrefix = '!';
const DiscordSubjectRolePrefix = '&';
const DiscordDiscriminatorSeparator = '#';

const MaxTextLength = 2000;

const MentionTypes = Object.freeze({
  member: "member",
  role: "role",
  channel: "channel"
});


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
   * The separator between a Discord user name and his/her discriminator
   * @type {string}
   */
  static get DISCORD_DISCRIMINATOR_SEPARATOR() {
    return DiscordDiscriminatorSeparator;
  }

  /**
   * The possible types of Discord mentions.
   * @type {Object}
   */
  static get MENTION_TYPES() {
    return MentionTypes;
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
   * Makes a string mentioning a user or role in the user-friendly manner (e.g. by name, not by id)
   * @param  {string} name the name of the Discord user or role
   * @return {string}      the mention string
   */
  static makeSubjectMentionByName(name) {
    return DiscordSubjectPrefix + name;
  }

  /**
   * Makes a string mentioning a channel in the user-friendly manner (e.g. by name, not by id)
   * @param  {string} name the name of the Discord channel
   * @return {string}      the mention string
   */
  static makeChannelMentionByName(name) {
    return DiscordChannelPrefix + name;
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
}

/**
 * Exports the DiscordUtils class
 * @type {DiscordUtils}
 */
module.exports = DiscordUtils;

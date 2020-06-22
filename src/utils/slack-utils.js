'use strict';

/**
 * @module slack-utils
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const SlackMentionStart = '<';
const SlackMentionEnd = '>';
const SlackChannelPrefix = '#';
const SlackSubjectPrefix = '@';
const SlackSubjectIdPrefix = '!';
const SlackSubjectRolePrefix = '&';
const SlackDiscriminatorSeparator = '#';

const MaxTextLength = 2000;

/**
 * Various utils related to Slack.
 * @alias SlackUtils
 */
class SlackUtils {
  /**
   * The start symbol of the Slack mention
   * @type {string}
   */
  static get SLACK_MENTION_START() {
    return SlackMentionStart;
  }

  /**
   * The end symbol of the Slack mention
   * @type {string}
   */
  static get SLACK_MENTION_END() {
    return SlackMentionEnd;
  }

  /**
   * The symbol of the Slack mention indicating it's a channel
   * @type {string}
   */
  static get SLACK_CHANNEL_PREFIX() {
    return SlackChannelPrefix;
  }

  /**
   * The symbol of the Slack mention indicating it's a subject
   * @type {string}
   */
  static get SLACK_SUBJECT_PREFIX() {
    return SlackSubjectPrefix;
  }

  /**
   * The symbol of the Slack mention indicating it's a user
   * @type {string}
   */
  static get SLACK_SUBJECT_ID_PREFIX() {
    return SlackSubjectIdPrefix;
  }

  /**
   * The symbol of the Slack mention indicating it's a role
   * @type {string}
   */
  static get SLACK_SUBJECT_ROLE_PREFIX() {
    return SlackSubjectRolePrefix;
  }

  /**
   * Makes a string mentioning a user, to be used in Slack messages
   * @param  {string} userId the id of the Slack user
   * @return {string}        the mention string
   */
  static makeUserMention(userId) {
    return SlackMentionStart + SlackSubjectPrefix + SlackSubjectIdPrefix + userId + SlackMentionEnd;
  }

  /**
   * Makes a string mentioning a role, to be used in Slack messages
   * @param  {string} userId the id of the Slack user
   * @return {string}        the mention string
   */
  static makeRoleMention(roleId) {
    return SlackMentionStart + SlackSubjectPrefix + SlackSubjectRolePrefix + roleId + SlackMentionEnd;
  }

  /**
   * Makes a string mentioning a channel, to be used in Slack messages
   * @param  {string} userId the id of the Slack user
   * @return {string}        the mention string
   */
  static makeChannelMention(channelId) {
    return SlackMentionStart + SlackChannelPrefix + channelId + SlackMentionEnd;
  }

  /**
   * Gets the full Slack user name by appending the discriminator to the display name.
   * @param  {string} usernameString the user name
   * @param  {number} discriminator  the discriminator id
   * @return {string}                the full discriminated user name
   */
  static getSlackUserName(usernameString, discriminator) {
    return usernameString + SlackDiscriminatorSeparator + discriminator.toString();
  }

  /**
   * Sends a message to Slack channel, considering the hard limit of symbols to be posted.
   * If the length is more than the limits, splits the message into several, if possible - at the line end
   * closest to the limit.
   * @param  {String}  slackChannel the Slack text channel
   * @param  {string}   text           the text to be posted
   * @param  {WebClient}   webClient   Slack web clinent
   * @return {Promise}                 nothing
   */
  static async sendToTextChannel(slackChannel, text,webClient) {
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
      await webClient.chat.postMessage({ text: nextPart, channel: slackChannel });
      /* eslint-enable no-await-in-loop */
    }

    await webClient.chat.postMessage({ text: remainingText, channel: slackChannel });
  }
}

/**
 * Exports the SlackUtils class
 * @type {SlackUtils}
 */
module.exports = SlackUtils;

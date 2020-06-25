'use strict';

/**
 * Wrapper for a source specific message
 */
class BaseMessage {
  /**
   * @param {String} orgId
   * @param {String} channelId
   * @param {String} userId
   * @param {String} content
   * @param {?} originalMessage
   * @param {BaseSource} source
   */
  constructor(orgId, channelId, userId, content, originalMessage, source) {
    this.orgId = orgId;
    this.channelId = channelId;
    this.userId = userId;
    this.content = content;
    this.originalMessage = originalMessage;
    this.source = source;
  }

  /**
   * Create BaseMessage from a Slack message
   * @param slackMessage
   * @param slackSource
   * @returns {BaseMessage}
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
   * @param discordMessage
   * @param discordSource
   * @returns {BaseMessage}
   */
  static createFromDiscord(discordMessage, discordSource) {
    console.log(discordMessage.member.id);
    console.log(discordMessage.author.id);
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
   * Simple reply to a message with a text
   * @param text
   * @returns {Promise<void>}
   */
  async reply(text) {
    this.source.replyToMessage(this, text);
  }
}

module.exports = BaseMessage;

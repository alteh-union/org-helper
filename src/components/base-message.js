'use strict';

class BaseMessage {

  constructor(teamId, channelId, userId, content, originalMessage, source) {
    this.teamId = teamId;
    this.channelId = channelId;
    this.userId = userId;
    this.content = content;
    this.originalMessage = originalMessage;
    this.source = source;

  }

  static createFromSlack(slackMessage, slackSource) {
    return new BaseMessage(slackMessage.team_id, slackMessage.channel, slackMessage.user, slackMessage.text,
      slackMessage, slackSource);
  }

  static createFromDiscord(discordMessage, discordSource) {
    return new BaseMessage(discordMessage.guild.id, discordMessage.channel.id, discordMessage.author.id,
      discordMessage.content, discordMessage, discordSource);
  }

  async reply(text) {
    this.source.replyToMessage(this, text);
  }
}

module.exports = BaseMessage;

'use strict';

class BaseMessage {

  constructor(teamId, channelId, userId, content, originalMessage) {
    this.teamId = teamId;
    this.channelId = channelId;
    this.userId = userId;
    this.content = content;
    this.originalMessage = originalMessage;

  }

  static createFromSlack(slackMessage) {
    return new BaseMessage(slackMessage.team_id, slackMessage.channel, slackMessage.user, slackMessage.text, slackMessage);
  }

  static createFromDiscord(discordMessage) {
    return new BaseMessage(discordMessage.guild.id, discordMessage.channel.id, discordMessage.author.id, discordMessage.content, discordMessage);
  }
}

module.exports = BaseMessage;
'use strict';

/**
 * @module clean-simple
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Check if the clean command work in the channel for the most recent messages.
 * @extends TestCase
 * @alias CleanSimple
 */
class CleanSimple extends TestCase {
  /**
   * Executes the test case
   * @return {Promise} nothing (in case of failure - an exception will be thrown)
   */
  async execute() {
    super.execute();

    const discordClient = this.processor.discordClient;
    this.assertNotNull(discordClient);
    const guild = discordClient.guilds.cache.get(this.processor.prefsManager.test_discord_guild_id);
    this.assertNotNull(guild);
    const channel = guild.channels.cache.get(this.processor.prefsManager.test_discord_text_channel_1_id);
    this.assertNotNull(channel);

    await this.sleep(5000);

    channel.send('!ping');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('!clean 5s');
    receivedMessage = await this.getReply(channel);
    const timeLimitMillis = new Date().getTime() - 5000;
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('cleaned 3 messages out of'));

    const messages = await channel.messages.fetch({ limit: 4 });
    this.assertNotNull(messages);
    const messagesArray = Array.from(messages.values());
    this.assertGreaterThan(messagesArray.length, 0);

    const recentMessages = [];
    for (const message of messagesArray) {
      if (message.createdTimestamp > timeLimitMillis) {
        recentMessages.push(message);
      }
    }

    let pingFound = false;
    let pongFound = false;
    let replyFound = false;

    for (const message of recentMessages) {
      if (message.content === '!ping') {
        pingFound = true;
      }
      if (message.content === 'pong!') {
        pongFound = true;
      }
      if (message.content.startsWith('cleaned 3 messages out of')) {
        replyFound = true;
      }
    }
    this.assertTrue(!pingFound);
    this.assertTrue(!pongFound);
    this.assertTrue(replyFound);
  }
}

/**
 * Exports the CleanSimple class
 * @type {CleanSimple}
 */
module.exports = CleanSimple;

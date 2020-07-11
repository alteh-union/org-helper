'use strict';

/**
 * @module clean-silent
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Check if the clean command does not reply if the 'silent' flag was enabled.
 * @extends TestCase
 * @alias CleanSilent
 */
class CleanSilent extends TestCase {
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

    await this.checkSilentClean(channel, '!clean 5s s');
    await this.checkSilentClean(channel, '!clean 5s silent');
    await this.checkSilentClean(channel, '!clean -t 5s -s s');
    await this.checkSilentClean(channel, '!clean -t 5s -silent silent');
  }

  /**
   * Checks if the "clean" can silently clean a given channel
   * @param  {Channel}  channel     the channel where the command needs to be executed
   * @param  {string}   commandText the text of the command
   * @return {Promise}              nothing
   */
  async checkSilentClean(channel, commandText) {
    await this.sleep(5000);

    channel.send('!ping');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send(commandText);
    receivedMessage = await this.getReply(channel);
    const timeLimitMillis = new Date().getTime() - 5000;
    this.assertNull(receivedMessage);

    const messages = await channel.messages.fetch({ limit: 3 });
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
      if (message.content.startsWith('cleaned')) {
        replyFound = true;
      }
    }
    this.assertTrue(!pingFound);
    this.assertTrue(!pongFound);
    this.assertTrue(!replyFound);
  }
}

/**
 * Exports the CleanSilent class
 * @type {CleanSilent}
 */
module.exports = CleanSilent;

'use strict';

/**
 * @module clean-other-channel
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Check if the clean command can clean one channel from another.
 * @extends TestCase
 * @alias CleanOtherChannel
 */
class CleanOtherChannel extends TestCase {
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
    const channel1 = guild.channels.cache.get(this.processor.prefsManager.test_discord_text_channel_1_id);
    this.assertNotNull(channel1);
    const channel2 = guild.channels.cache.get(this.processor.prefsManager.test_discord_text_channel_2_id);
    this.assertNotNull(channel2);

    await this.sleep(5000);

    await channel2.send('Delete me!');

    await channel1.send('Dont delete me!');

    channel1.send('!clean -c <#' + channel2.id + '> -t 5s');
    const receivedMessage = await this.getReply(channel1);
    const timeLimitMillis = new Date().getTime() - 5000;
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('cleaned 1 '));

    const messages1 = await channel1.messages.fetch({ limit: 4 });
    this.assertNotNull(messages1);
    const messagesArray1 = Array.from(messages1.values());

    const recentMessages1 = [];
    for (const message of messagesArray1) {
      if (message.createdTimestamp > timeLimitMillis) {
        recentMessages1.push(message);
      }
    }

    const messages2 = await channel2.messages.fetch({ limit: 4 });
    this.assertNotNull(messages2);
    const messagesArray2 = Array.from(messages2.values());

    const recentMessages2 = [];
    for (const message of messagesArray2) {
      if (message.createdTimestamp > timeLimitMillis) {
        recentMessages2.push(message);
      }
    }

    let deleteFound = false;
    let dontDeleteFound = false;
    let replyFound = false;

    for (const message of recentMessages1) {
      if (message.content === 'Dont delete me!') {
        dontDeleteFound = true;
      }
      if (message.content.startsWith('cleaned 1 ')) {
        replyFound = true;
      }
    }

    for (const message of recentMessages2) {
      if (message.content === 'Delete me!') {
        deleteFound = true;
      }
    }

    this.assertTrue(dontDeleteFound);
    this.assertTrue(!deleteFound);
    this.assertTrue(replyFound);
  }
}

/**
 * Exports the CleanOtherChannel class
 * @type {CleanOtherChannel}
 */
module.exports = CleanOtherChannel;

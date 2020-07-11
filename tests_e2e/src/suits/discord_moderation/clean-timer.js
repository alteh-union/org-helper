'use strict';

/**
 * @module clean-timer
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Check that the clean command does not selete messages earlier than the specified thershold.
 * @extends TestCase
 * @alias CleanTimer
 */
class CleanTimer extends TestCase {
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

    await channel.send('Dont delete me');

    await this.sleep(3000);

    await channel.send('Delete me');

    channel.send('!clean 3s');
    const receivedMessage = await this.getReply(channel);
    const timeLimitMillis = new Date().getTime() - 8000;
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('cleaned'));

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

    let dontDeleteMeFound = false;
    let deleteMeFound = false;
    let replyFound = false;

    for (const message of recentMessages) {
      if (message.content === 'Dont delete me') {
        dontDeleteMeFound = true;
      }
      if (message.content === 'Delete me') {
        deleteMeFound = true;
      }
      if (message.content.startsWith('cleaned')) {
        replyFound = true;
      }
    }
    this.assertTrue(dontDeleteMeFound);
    this.assertTrue(!deleteMeFound);
    this.assertTrue(replyFound);
  }
}

/**
 * Exports the CleanTimer class
 * @type {CleanTimer}
 */
module.exports = CleanTimer;

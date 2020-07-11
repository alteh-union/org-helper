'use strict';

/**
 * @module clean-all
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Check if the 'all' predefined time value works for the clean command
 * @extends TestCase
 * @alias CleanAll
 */
class CleanAll extends TestCase {
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

    channel.send('!clean all s');

    let needRecheck = true;
    let currentMessages = [];
    while (needRecheck) {
      await this.sleep(10000);

      needRecheck = false;

      const messages = await channel.messages.fetch({ limit: 50 }, false);
      this.assertNotNull(messages);
      const messagesArray = Array.from(messages.values());

      if (messagesArray.length > 0) {
        if (messagesArray.length !== currentMessages.length) {
          needRecheck = true;
        } else {
          for (let i = 0; i < messagesArray.length; i++) {
            if (messagesArray[i].id !== currentMessages[i].id) {
              needRecheck = true;
              break;
            }
          }
        }
      }

      if (needRecheck) {
        currentMessages = messagesArray;
      }
    }

    const remainingMessages = await channel.messages.fetch({ limit: 50 }, false);
    this.assertNotNull(remainingMessages);
    const remainingMessagesArray = Array.from(remainingMessages.values());
    this.assertGreaterThan(1, remainingMessagesArray.length);
  }
}

/**
 * Exports the CleanAll class
 * @type {CleanAll}
 */
module.exports = CleanAll;

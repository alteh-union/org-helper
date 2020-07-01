'use strict';

/**
 * @module wrong-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Asserts that the bot does not reply to a not recognized command.
 * @extends TestCase
 * @alias WrongCommand
 */
class WrongCommand extends TestCase {
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
    channel.send('!peeng');
    const receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);
  }
}

/**
 * Exports the WrongCommand class
 * @type {WrongCommand}
 */
module.exports = WrongCommand;

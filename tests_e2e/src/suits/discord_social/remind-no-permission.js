'use strict';

/**
 * @module remind-no-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot denies reminders if no remind permission is set.
 * @extends TestCase
 * @alias RemindNoPermission
 */
class RemindNoPermission extends TestCase {
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

    channel.send('!remind 5s test');
    const receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Authorization error. You need to have "remind" permission to launch' +
      ' the command with the specified arguments. Contact server\'s admin if you need to get the permission.');
  }
}

/**
 * Exports the RemindNoPermission class
 * @type {RemindNoPermission}
 */
module.exports = RemindNoPermission;

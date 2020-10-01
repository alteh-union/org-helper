'use strict';

/**
 * @module remind-other-channel-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot denies reminders if they are permitted only in a different channel,
 * but allows them in that different channel.
 * @extends TestCase
 * @alias RemindOtherChannelPermission
 */
class RemindOtherChannelPermission extends TestCase {
  /**
   * Executes the test case
   * @return {Promise} nothing (in case of failure - an exception will be thrown)
   */
  async execute() {
    super.execute();

    const discordClient = this.processor.discordClient;
    this.assertNotNull(discordClient);
    const user = discordClient.user;
    this.assertNotNull(user);
    const guild = discordClient.guilds.cache.get(this.processor.prefsManager.test_discord_guild_id);
    this.assertNotNull(guild);
    const channel1 = guild.channels.cache.get(this.processor.prefsManager.test_discord_text_channel_1_id);
    this.assertNotNull(channel1);
    const channel2 = guild.channels.cache.get(this.processor.prefsManager.test_discord_text_channel_2_id);
    this.assertNotNull(channel2);

    channel1.send('!permitremind <@!' + user.id + '> <#' + channel2.id + '>');
    let receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.');

    channel1.send('!remind 5s test');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Authorization error. You need to have "remind" permission to launch' +
      ' the command with the specified arguments. Contact server\'s admin if you need to get the permission.');

    channel2.send('!remind 3s test');
    receivedMessage = await this.getReply(channel2);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content
      .indexOf('The following reminder was successfully added and scheduled:') >= 0);

    receivedMessage = await this.getReply(channel2, 5000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'test');

    channel1.send('!denyremind <@!' + user.id + '> <#' + channel2.id + '>');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');
  }
}

/**
 * Exports the RemindOtherChannelPermission class
 * @type {RemindOtherChannelPermission}
 */
module.exports = RemindOtherChannelPermission;

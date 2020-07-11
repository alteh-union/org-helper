'use strict';

/**
 * @module remind-multi-channel-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot allows to add remind permissions to multiple channels at once.
 * @extends TestCase
 * @alias RemindMultiChannelPermission
 */
class RemindMultiChannelPermission extends TestCase {
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

    channel1.send('!permitremind <@!' + user.id + '> <#' + channel1.id + '>, <#' + channel2.id + '>');
    let receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.' +
      '\nSuccessfully added the permission.');

    channel1.send('!remind 3s test1');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added and scheduled a reminder.');

    receivedMessage = await this.getReply(channel1, 5000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'test1');

    channel2.send('!remind 3s test2');
    receivedMessage = await this.getReply(channel2);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added and scheduled a reminder.');

    receivedMessage = await this.getReply(channel2, 5000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'test2');

    channel1.send('!denyremind <@!' + user.id + '> <#' + channel1.id + '>, <#' + channel2.id + '>');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 2 permission(s).');
  }
}

/**
 * Exports the RemindMultiChannelPermission class
 * @type {RemindMultiChannelPermission}
 */
module.exports = RemindMultiChannelPermission;

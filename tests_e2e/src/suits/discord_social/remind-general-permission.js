'use strict';

/**
 * @module remind-general-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the remind permission works in all channels if permitted everywhere.
 * @extends TestCase
 * @alias RemindGeneralPermission
 */
class RemindGeneralPermission extends TestCase {
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

    channel1.send('!permitremind <@!' + user.id + '>');
    let receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.');

    channel1.send('!remind 3s test1');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content
      .indexOf('The following reminder was successfully added and scheduled:') >= 0);

    receivedMessage = await this.getReply(channel1, 5000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'test1');

    channel2.send('!remind 3s test2');
    receivedMessage = await this.getReply(channel2);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content
      .indexOf('The following reminder was successfully added and scheduled:') >= 0);

    receivedMessage = await this.getReply(channel2, 5000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'test2');

    channel1.send('!denyremind <@!' + user.id + '>');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');
  }
}

/**
 * Exports the RemindGeneralPermission class
 * @type {RemindGeneralPermission}
 */
module.exports = RemindGeneralPermission;

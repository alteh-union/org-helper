'use strict';

/**
 * @module remind-permissions-any-channel
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot allows reminders to all channels at once, and properly displays the remind permissions.
 * @extends TestCase
 * @alias RemindPermissionsAnyChannel
 */
class RemindPermissionsAnyChannel extends TestCase {
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
    const user1 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_1_id);
    this.assertNotNull(user1);
    const user2 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_2_id);
    this.assertNotNull(user2);

    channel.send('!permitremind <@!' + user1.id + '>, <@!' + user2.id + '>');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.' +
      '\nSuccessfully added the permission.');

    channel.send('!permissions');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  channel : any; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  channel : any; }') >= 0);

    channel.send('!denyremind <@!' + user1.id + '>, <@!' + user2.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 2 permission(s).');

    channel.send('!permissions');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  channel : any; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  channel : any; }') < 0);
  }
}

/**
 * Exports the RemindPermissionsAnyChannel class
 * @type {RemindPermissionsAnyChannel}
 */
module.exports = RemindPermissionsAnyChannel;

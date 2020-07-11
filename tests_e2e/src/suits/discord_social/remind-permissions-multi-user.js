'use strict';

/**
 * @module remind-permissions-multi-user
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot allows reminders to multiple users at once, and properly displays the remind permissions.
 * @extends TestCase
 * @alias RemindPermissionsMultiUser
 */
class RemindPermissionsMultiUser extends TestCase {
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
    const user1 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_1_id);
    this.assertNotNull(user1);
    const user2 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_2_id);
    this.assertNotNull(user2);

    channel1.send('!permitremind <@!' + user1.id + '>, <@!' + user2.id + '>' +
      ' <#' + channel1.id + '>, <#' + channel2.id + '>');
    let receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.' +
      '\nSuccessfully added the permission.' +
      '\nSuccessfully added the permission.' +
      '\nSuccessfully added the permission.');

    channel1.send('!permissions');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  channel : <#' + channel1.id + '>; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  channel : <#' + channel2.id + '>; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  channel : <#' + channel1.id + '>; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  channel : <#' + channel2.id + '>; }') >= 0);

    channel1.send('!denyremind <@!' + user1.id + '>, <@!' + user2.id + '>' +
      ' <#' + channel1.id + '>, <#' + channel2.id + '>');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 4 permission(s).');

    channel1.send('!permissions');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  channel : <#' + channel1.id + '>; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  channel : <#' + channel2.id + '>; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  channel : <#' + channel1.id + '>; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "remind" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  channel : <#' + channel2.id + '>; }') < 0);
  }
}

/**
 * Exports the RemindPermissionsMultiUser class
 * @type {RemindPermissionsMultiUser}
 */
module.exports = RemindPermissionsMultiUser;

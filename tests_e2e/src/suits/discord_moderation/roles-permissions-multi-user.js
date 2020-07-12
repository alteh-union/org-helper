'use strict';

/**
 * @module roles-permissions-multi-user
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot adds role management to multiple users at once, and properly displays the permissions.
 * @extends TestCase
 * @alias RolesPermissionsMultiUser
 */
class RolesPermissionsMultiUser extends TestCase {
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
    const role1 = guild.roles.cache.get(this.processor.prefsManager.test_discord_role_1_id);
    this.assertNotNull(role1);
    const role2 = guild.roles.cache.get(this.processor.prefsManager.test_discord_role_2_id);
    this.assertNotNull(role2);
    const user1 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_1_id);
    this.assertNotNull(user1);
    const user2 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_2_id);
    this.assertNotNull(user2);

    channel.send('!addrolemanager <@!' + user1.id + '>, <@!' + user2.id + '>' +
      ' <@&' + role1.id + '>, <@&' + role2.id + '>');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.' +
      '\nSuccessfully added the permission.' +
      '\nSuccessfully added the permission.' +
      '\nSuccessfully added the permission.');

    channel.send('!permissions');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  role : <@&' + role1.id + '>; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  role : <@&' + role2.id + '>; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  role : <@&' + role1.id + '>; }') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  role : <@&' + role2.id + '>; }') >= 0);

    channel.send('!removerolemanager <@!' + user1.id + '>, <@!' + user2.id + '>' +
      ' <@&' + role1.id + '>, <@&' + role2.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 4 permission(s).');

    channel.send('!permissions');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  role : <@&' + role1.id + '>; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user1.id + '>, with the following conditions:  {  role : <@&' + role2.id + '>; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  role : <@&' + role1.id + '>; }') < 0);
    this.assertTrue(receivedMessage.content.indexOf('of type "role" is granted for member with name <@!' +
      user2.id + '>, with the following conditions:  {  role : <@&' + role2.id + '>; }') < 0);
  }
}

/**
 * Exports the RolesPermissionsMultiUser class
 * @type {RolesPermissionsMultiUser}
 */
module.exports = RolesPermissionsMultiUser;

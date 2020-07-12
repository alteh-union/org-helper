'use strict';

/**
 * @module roles-permissions-direct-delete
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if it's possible to remove role permissions by permission ids.
 * @extends TestCase
 * @alias RolesPermissionsDirectDelete
 */
class RolesPermissionsDirectDelete extends TestCase {
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
    const receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    const permissionIds = [];
    let permission1Found = false;
    let permission2Found = false;
    let permission3Found = false;
    let permission4Found = false;
    const permissionsArray = totalText.split('\n');
    for (const permission of permissionsArray) {
      let permissionMatches = false;
      if (permission.indexOf('of type "role" is granted for member with name <@!' +
        user1.id + '>, with the following conditions:  {  role : <@&' + role1.id + '>; }') >= 0) {
        permission1Found = true;
        permissionMatches = true;
      } else if (permission.indexOf('of type "role" is granted for member with name <@!' +
        user1.id + '>, with the following conditions:  {  role : <@&' + role2.id + '>; }') >= 0) {
        permission2Found = true;
        permissionMatches = true;
      } else if (permission.indexOf('of type "role" is granted for member with name <@!' +
        user2.id + '>, with the following conditions:  {  role : <@&' + role1.id + '>; }') >= 0) {
        permission3Found = true;
        permissionMatches = true;
      } else if (permission.indexOf('of type "role" is granted for member with name <@!' +
        user2.id + '>, with the following conditions:  {  role : <@&' + role2.id + '>; }') >= 0) {
        permission4Found = true;
        permissionMatches = true;
      }

      if (permissionMatches) {
        const permissionPart = permission.slice('Permission id: '.length);
        const firstSpace = permissionPart.indexOf(' ');
        permissionIds.push(permissionPart.slice(0, firstSpace));
      }
    }

    this.assertTrue(permission1Found);
    this.assertTrue(permission2Found);
    this.assertTrue(permission3Found);
    this.assertTrue(permission4Found);
    this.assertEquals(permissionIds.length, 4);

    channel.send('!deletepermission ' + permissionIds.join());
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed the permissions.');

    channel.send('!removerolemanager <@!' + user1.id + '>, <@!' + user2.id + '>' +
      ' <@&' + role1.id + '>, <@&' + role2.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'No matching permissions found.');

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
 * Exports the RolesPermissionsDirectDelete class
 * @type {RolesPermissionsDirectDelete}
 */
module.exports = RolesPermissionsDirectDelete;

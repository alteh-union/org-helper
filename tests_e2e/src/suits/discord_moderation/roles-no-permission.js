'use strict';

/**
 * @module roles-no-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot denies role management if no role permission is set.
 * @extends TestCase
 * @alias RolesNoPermission
 */
class RolesNoPermission extends TestCase {
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
    const channel = guild.channels.cache.get(this.processor.prefsManager.test_discord_text_channel_1_id);
    this.assertNotNull(channel);
    const role = guild.roles.cache.get(this.processor.prefsManager.test_discord_role_1_id);
    this.assertNotNull(role);

    channel.send('!addrole <@!' + user.id + '> <@&' + role.id + '>');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Authorization error. You need to have "role" permission to launch' +
      ' the command with the specified arguments. Contact server\'s admin if you need to get the permission.');

    channel.send('!addrolemanager <@!' + user.id + '> <@&' + role.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.');

    channel.send('!addrole <@!' + user.id + '> <@&' + role.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Added 1 roles in total to all members out of 1 requests' +
      ' (skipped duplicates). Errors count: 0.');

    let member = guild.members.cache.get(user.id);
    this.assertNotNull(member);
    let roleValue = member.roles.cache.get(role.id);
    this.assertNotNull(roleValue);

    channel.send('!removerole <@!' + user.id + '> <@&' + role.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Removed 1 roles in total from all members out of 1 requested' +
      ' (skipped the ones which the members did not have anyway). Error count: 0.');

    member = guild.members.cache.get(user.id);
    this.assertNotNull(member);
    roleValue = member.roles.cache.get(role.id);
    this.assertNull(roleValue);

    channel.send('!removerolemanager <@!' + user.id + '> <@&' + role.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');

    channel.send('!removerole <@!' + user.id + '> <@&' + role.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Authorization error. You need to have "role" permission to launch' +
      ' the command with the specified arguments. Contact server\'s admin if you need to get the permission.');
  }
}

/**
 * Exports the RolesNoPermission class
 * @type {RolesNoPermission}
 */
module.exports = RolesNoPermission;

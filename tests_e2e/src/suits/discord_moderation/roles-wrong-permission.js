'use strict';

/**
 * @module roles-wrong-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot denies role management if a permission is set to a wrong role.
 * @extends TestCase
 * @alias RolesWrongPermission
 */
class RolesWrongPermission extends TestCase {
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
    const role1 = guild.roles.cache.get(this.processor.prefsManager.test_discord_role_1_id);
    this.assertNotNull(role1);
    const role2 = guild.roles.cache.get(this.processor.prefsManager.test_discord_role_2_id);
    this.assertNotNull(role2);

    channel.send('!addrolemanager <@!' + user.id + '> <@&' + role2.id + '>');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.');

    channel.send('!addrole <@!' + user.id + '> <@&' + role1.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Authorization error. You need to have "role" permission to launch' +
      ' the command with the specified arguments. Contact server\'s admin if you need to get the permission.');

    const member = guild.members.cache.get(user.id);
    this.assertNotNull(member);
    const roleValue = member.roles.cache.get(role1.id);
    this.assertNull(roleValue);

    channel.send('!removerole <@!' + user.id + '> <@&' + role1.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Authorization error. You need to have "role" permission to launch' +
      ' the command with the specified arguments. Contact server\'s admin if you need to get the permission.');

    channel.send('!removerolemanager <@!' + user.id + '> <@&' + role2.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');
  }
}

/**
 * Exports the RolesWrongPermission class
 * @type {RolesWrongPermission}
 */
module.exports = RolesWrongPermission;

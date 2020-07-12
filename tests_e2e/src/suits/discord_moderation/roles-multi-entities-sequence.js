'use strict';

/**
 * @module roles-multi-entities-sequence
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if the bot allows role management with multiple users and multiple roles at once,
 * with arguments entered sequentially.
 * @extends TestCase
 * @alias RolesMultiEntitiesSequence
 */
class RolesMultiEntitiesSequence extends TestCase {
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
    const user1 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_1_id);
    this.assertNotNull(user1);
    const user2 = guild.members.cache.get(this.processor.prefsManager.test_discord_user_2_id);
    this.assertNotNull(user2);

    channel.send('!addrolemanager <@!' + user.id + '> <@&' + role1.id + '>, <@&' + role2.id + '>');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.' +
      '\nSuccessfully added the permission.');

    channel.send('!addrole <@!' + user1.id + '>, <@!' + user2.id + '> <@&' + role1.id + '>, <@&' + role2.id + '>');
    // For some reason the main bot cannot handle this particular command within the 10 seconds timeout,
    // so using an increased timeout.
    receivedMessage = await this.getReply(channel, 15000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Added 4 roles in total to all members out of 4 requests' +
      ' (skipped duplicates). Errors count: 0.');

    let member1 = guild.members.cache.get(user1.id);
    this.assertNotNull(member1);
    let member1Role1Value = member1.roles.cache.get(role1.id);
    this.assertNotNull(member1Role1Value);
    let member1Role2Value = member1.roles.cache.get(role2.id);
    this.assertNotNull(member1Role2Value);

    let member2 = guild.members.cache.get(user2.id);
    this.assertNotNull(member2);
    let member2Role1Value = member2.roles.cache.get(role1.id);
    this.assertNotNull(member2Role1Value);
    let member2Role2Value = member2.roles.cache.get(role2.id);
    this.assertNotNull(member2Role2Value);

    channel.send('!removerole <@!' + user1.id + '>, <@!' + user2.id + '> <@&' + role1.id + '>, <@&' + role2.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Removed 4 roles in total from all members out of 4 requested' +
      ' (skipped the ones which the members did not have anyway). Error count: 0.');

    member1 = guild.members.cache.get(user1.id);
    this.assertNotNull(member1);
    member1Role1Value = member1.roles.cache.get(role1.id);
    this.assertNull(member1Role1Value);
    member1Role2Value = member1.roles.cache.get(role2.id);
    this.assertNull(member1Role2Value);

    member2 = guild.members.cache.get(user2.id);
    this.assertNotNull(member2);
    member2Role1Value = member2.roles.cache.get(role1.id);
    this.assertNull(member2Role1Value);
    member2Role2Value = member2.roles.cache.get(role2.id);
    this.assertNull(member2Role2Value);

    channel.send('!removerolemanager <@!' + user.id + '> <@&' + role1.id + '>, <@&' + role2.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 2 permission(s).');
  }
}

/**
 * Exports the RolesMultiEntitiesSequence class
 * @type {RolesMultiEntitiesSequence}
 */
module.exports = RolesMultiEntitiesSequence;

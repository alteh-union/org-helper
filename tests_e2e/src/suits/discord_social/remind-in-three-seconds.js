'use strict';

/**
 * @module remind-in-three-seconds
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if reminder can be set up for a distance kind of schedule (e.g. 3 seconds since the current moment).
 * @extends TestCase
 * @alias RemindInThreeSeconds
 */
class RemindInThreeSeconds extends TestCase {
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

    channel.send('!permitremind <@!' + user.id + '>');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added the permission.');

    channel.send('!reminders');
    let receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    const remindersArrayStartLength = totalText.split('\n').length;

    channel.send('!remind in 3s e2e test');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added and scheduled a reminder.');

    receivedMessage = await this.getReply(channel, 3000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'e2e test');

    channel.send('!reminders');
    receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    const remindersArrayEndLength = totalText.split('\n').length;

    channel.send('!denyremind <@!' + user.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');

    this.assertEquals(remindersArrayStartLength, remindersArrayEndLength);
  }
}

/**
 * Exports the RemindInThreeSeconds class
 * @type {RemindInThreeSeconds}
 */
module.exports = RemindInThreeSeconds;

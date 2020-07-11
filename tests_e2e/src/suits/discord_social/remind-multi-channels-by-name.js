'use strict';

/**
 * @module remind-multi-channels-by-name
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if reminders can be set up with parameters by names and with multiple channels at once.
 * @extends TestCase
 * @alias RemindMultiChannelsByName
 */
class RemindMultiChannelsByName extends TestCase {
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

    channel1.send('!reminders');
    let receivedMessages = await this.getAllReplies(channel1);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    const remindersArrayStartLength = totalText.split('\n').length;

    channel1.send('!remind -t in 3s -c <#' + channel1.id + '>, <#' + channel2.id + '> -m e2e test');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added and scheduled a reminder.' +
      '\nSuccessfully added and scheduled a reminder.');

    const resultPromises = [];
    resultPromises.push(this.getReply(channel1, 3000));
    resultPromises.push(this.getReply(channel2, 3000));
    const results = await Promise.all(resultPromises);
    this.assertNotNull(results);
    this.assertEquals(results.length, 2);
    for (const receivedMessage of results) {
      this.assertNotNull(receivedMessage);
      this.assertEquals(receivedMessage.content, 'e2e test');
    }

    channel1.send('!reminders');
    receivedMessages = await this.getAllReplies(channel1);
    this.assertNotNull(receivedMessages);
    totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    const remindersArrayEndLength = totalText.split('\n').length;

    channel1.send('!denyremind <@!' + user.id + '>');
    receivedMessage = await this.getReply(channel1);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');

    this.assertEquals(remindersArrayStartLength, remindersArrayEndLength);
  }
}

/**
 * Exports the RemindMultiChannelsByName class
 * @type {RemindMultiChannelsByName}
 */
module.exports = RemindMultiChannelsByName;

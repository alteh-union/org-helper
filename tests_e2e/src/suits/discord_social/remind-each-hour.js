'use strict';

/**
 * @module remind-each-hour
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks reminder set up for each hour.
 * @extends TestCase
 * @alias RemindEachHour
 */
class RemindEachHour extends TestCase {
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

    channel.send('!settings');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    const timezone = this.getSettingValue(receivedMessage.content, 'timezone', TestCase.DEFAULT_TIMEZONE);

    const targetTime = new Date(new Date().getTime() + 5000);
    const hours = ("0" + targetTime.getHours()).slice(-2);
    const minutes = ("0" + targetTime.getMinutes()).slice(-2);
    const seconds = ("0" + targetTime.getSeconds()).slice(-2);

    channel.send('!remind each ' + hours + ':' + minutes + ':' + seconds + ' e2e test');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully added and scheduled a reminder.');

    receivedMessage = await this.getReply(channel, 6000);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'e2e test');

    channel.send('!reminders');
    const receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    let reminderFound = false;
    const remindersArray = totalText.split('\n');
    for (const reminder of remindersArray) {
      if (reminder.indexOf('time: * * * ' + hours + ':' + minutes + ':' + seconds + ' '
        + timezone + '; channel: <#' + channel.id + '>; message: e2e test') >= 0) {

        reminderFound = true;

        const semicolonIndex = reminder.indexOf(';');
        const reminderPart = reminder.slice(0, semicolonIndex);
        const lastSpace = reminderPart.lastIndexOf(' ');
        const reminderId = reminderPart.slice(lastSpace + 1);

        channel.send('!deletereminder ' + reminderId);
        receivedMessage = await this.getReply(channel);
        this.assertNotNull(receivedMessage);
        this.assertEquals(receivedMessage.content, 'Successfully removed the reminders.');

        break;
      }
    }

    this.assertTrue(reminderFound);

    channel.send('!denyremind <@!' + user.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');
  }
}

/**
 * Exports the RemindEachHour class
 * @type {RemindEachHour}
 */
module.exports = RemindEachHour;

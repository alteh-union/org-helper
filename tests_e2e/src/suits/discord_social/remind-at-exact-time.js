'use strict';

/**
 * @module remind-at-exact-time
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks if reminders work if set up at exact time.
 * @extends TestCase
 * @alias RemindAtExactTime
 */
class RemindAtExactTime extends TestCase {
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

    const targetTime = new Date(new Date().getTime() + 9000);
    const year = targetTime.getFullYear();
    const month = this.dateMonthToString(targetTime.getMonth());
    const day = targetTime.getDate();
    const hours = ("0" + targetTime.getHours()).slice(-2);
    const minutes = ("0" + targetTime.getMinutes()).slice(-2);
    const seconds = ("0" + targetTime.getSeconds()).slice(-2);

    channel.send('!remind at ' + year + ' ' + month + ' ' + day + ' ' +
      hours + ':' + minutes + ':' + seconds + ' e2e test');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content
      .indexOf('The following reminder was successfully added and scheduled:') >= 0);

    channel.send('!reminders');
    let receivedMessages = await this.getAllReplies(channel, 5000);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    let reminderFound = false;
    let remindersArray = totalText.split('\n');
    for (const reminder of remindersArray) {
      if (reminder.indexOf('time: ' + year + ' ' + month + ' ' + day + ' '
        + hours + ':' + minutes + ':' + seconds + ' '
        + timezone + '; channel: <#' + channel.id + '>; message: e2e test') >= 0) {

        reminderFound = true;
        break;
      }
    }

    this.assertTrue(reminderFound);

    receivedMessage = await this.getReply(channel, 12000);
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
    reminderFound = false;
    remindersArray = totalText.split('\n');
    for (const reminder of remindersArray) {
      if (reminder.indexOf('time: ' + year + ' ' + month + ' ' + day + ' '
        + hours + ':' + minutes + ':' + seconds + ' '
        + timezone + '; channel: <#' + channel.id + '>; message: e2e test') >= 0) {

        reminderFound = true;
        break;
      }
    }

    this.assertTrue(!reminderFound);

    channel.send('!denyremind <@!' + user.id + '>');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Successfully removed 1 permission(s).');
  }
}

/**
 * Exports the RemindAtExactTime class
 * @type {RemindAtExactTime}
 */
module.exports = RemindAtExactTime;

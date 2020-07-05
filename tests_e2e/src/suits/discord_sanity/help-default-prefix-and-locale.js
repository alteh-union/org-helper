'use strict';

/**
 * @module help-default-prefix-and-locale
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks that the Bot reacts on the default "!help" input even when locale and.
 * @extends TestCase
 * @alias HelpSingleSequentially
 */
class HelpSingleSequentially extends TestCase {
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

    channel.send('!help');
    let receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith('Available commands are below. Use !help'));

    channel.send('!setmylocale');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('Removed the locale preference for user'));

    channel.send('!setlocale en-US');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set locale to en-US.');

    channel.send('!help');
    receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith('Available commands are below. Use !help'));

    channel.send('!setprefix ?');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set prefix to ?.');

    channel.send('!help');
    receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith('Available commands are below. Use ?help'));

    channel.send('?setlocale ru-RU');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set locale to ru-RU.');

    channel.send('!help');
    receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith('Список доступных команд - ниже. Используйте ?помощь'));

    channel.send('?задатьязык en-US');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Язык (локаль) установлен: en-US.');

    channel.send('?setmylocale ru-RU');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('Set locale for user'));

    channel.send('!help');
    receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith('Список доступных команд - ниже. Используйте ?помощь'));

    channel.send('?задатьмойязык');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith(
      'Убрана настройка индивидуального языка (локали) для пользователя:'));

    channel.send('?setprefix !');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set prefix to !.');
  }
}

/**
 * Exports the HelpSingleSequentially class
 * @type {HelpSingleSequentially}
 */
module.exports = HelpSingleSequentially;

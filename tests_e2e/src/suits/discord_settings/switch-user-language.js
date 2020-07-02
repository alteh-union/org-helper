'use strict';

/**
 * @module switch-user-language
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks that the Bot can understand English and Russian and can switch from 1 user language
 * to another and back.
 * @extends TestCase
 * @alias SwitchUserLanguage
 */
class SwitchUserLanguage extends TestCase {
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

    channel.send('!ping');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('!setmylocale ru-RU');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('Set locale for user'));
    this.assertTrue(receivedMessage.content.endsWith('to ru-RU.'));

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!пинг');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'понг!');

    channel.send('!задатьмойязык en-US');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('Для пользователя'));
    this.assertTrue(receivedMessage.content.endsWith('установлен язык (локаль) en-US.'));

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('!пинг');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!setmylocale ru-RU');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('Set locale for user'));
    this.assertTrue(receivedMessage.content.endsWith('to ru-RU.'));

    channel.send('!задатьмойязык');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith(
      'Убрана настройка индивидуального языка (локали) для пользователя:'));

    channel.send('!пинг');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');
  }
}

/**
 * Exports the SwitchUserLanguage class
 * @type {SwitchUserLanguage}
 */
module.exports = SwitchUserLanguage;

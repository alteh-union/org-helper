'use strict';

/**
 * @module switch-server-language
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks that the Bot can understand English and Russian and can switch from 1 server language
 * to another and back.
 * @extends TestCase
 * @alias SwitchServerLanguage
 */
class SwitchServerLanguage extends TestCase {
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

    channel.send('!setlocale ru-RU');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set locale to ru-RU.');

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!пинг');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'понг!');

    channel.send('!задатьязык en-US');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Язык (локаль) установлен: en-US.');

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('!пинг');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);
  }
}

/**
 * Exports the SwitchServerLanguage class
 * @type {SwitchServerLanguage}
 */
module.exports = SwitchServerLanguage;

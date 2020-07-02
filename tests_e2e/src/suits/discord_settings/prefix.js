'use strict';

/**
 * @module prefix
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks that the Bot can use different prefixes.
 * @extends TestCase
 * @alias Prefix
 */
class Prefix extends TestCase {
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

    channel.send('!setprefix ?');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set prefix to ?.');

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('?ping');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('?setprefix arbitrary_prefix');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set prefix to arbitrary_prefix.');

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('?ping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('arbitrary_prefixping');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('arbitrary_prefixsetprefix !');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Set prefix to !.');

    channel.send('!ping');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'pong!');

    channel.send('?ping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('arbitrary_prefixping');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);
  }
}

/**
 * Exports the Prefix class
 * @type {Prefix}
 */
module.exports = Prefix;

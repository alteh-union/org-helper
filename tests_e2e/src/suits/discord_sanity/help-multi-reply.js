'use strict';

/**
 * @module help-multi-reply
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks that the Bot can make a reply with more than 2000 symbols (the hard limit of Discord per 1 message).
 * @extends TestCase
 * @alias HelpMultiReply
 */
class HelpMultiReply extends TestCase {
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
    const receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    this.assertGreaterThan(receivedMessages.length, 1);
    let textLength = 0;
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      textLength += message.content.length;
    }
    this.assertGreaterThan(textLength, 2000);
  }
}

/**
 * Exports the HelpMultiReply class
 * @type {HelpMultiReply}
 */
module.exports = HelpMultiReply;

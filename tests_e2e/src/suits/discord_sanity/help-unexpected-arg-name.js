'use strict';

/**
 * @module help-unexpected-arg-name
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks the output of the help with a wrong argument name (the unexpected arg should be ignored).
 * @extends TestCase
 * @alias HelpUnexpectedArgName
 */
class HelpUnexpectedArgName extends TestCase {
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

    channel.send('!help -a wrongcommand');
    const receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith(
      'Available commands are below. Use !help <command name> to get more details about the command'));
  }
}

/**
 * Exports the HelpUnexpectedArgName class
 * @type {HelpUnexpectedArgName}
 */
module.exports = HelpUnexpectedArgName;

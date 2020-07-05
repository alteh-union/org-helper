'use strict';

/**
 * @module help-wrong-arg-value
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks the output of the help when a wrong "command" arg value is specified.
 * @extends TestCase
 * @alias HelpWrongArgValue
 */
class HelpWrongArgValue extends TestCase {
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

    channel.send('!help wrongcommand');
    const receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith('The bot does not have such command to help with. '
      + 'The closest variants are:'));
  }
}

/**
 * Exports the HelpWrongArgValue class
 * @type {HelpWrongArgValue}
 */
module.exports = HelpWrongArgValue;

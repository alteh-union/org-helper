'use strict';

/**
 * @module help-default
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks the default output of the help command.
 * @extends TestCase
 * @alias HelpDefault
 */
class HelpDefault extends TestCase {
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
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith(
      'Available commands are below. Use !help <command name> to get more details about the command'));
    this.assertTrue(totalText.indexOf('!help : Prints the bot\'s help. If you are not an admin, then by'
      + ' default prints only non-admin commands. Type \'all\' as the argument to get help on all commands.') >= 0);
  }
}

/**
 * Exports the HelpDefault class
 * @type {HelpDefault}
 */
module.exports = HelpDefault;

'use strict';

/**
 * @module help-exceeding-arg
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks the output of the help when there is exceeding text after the normal sequnetial arg input
 * (the exceeding part should be ignored).
 * @extends TestCase
 * @alias HelpExceedingArg
 */
class HelpExceedingArg extends TestCase {
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

    channel.send('!help help exceeding');
    const receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Prints the bot\'s help. If you are not an admin,'
      + ' then by default prints only non-admin commands. Type \'all\' as the argument to get help on all commands.'
      + '\n -command  -c : The name of the command which you want to get help for.');
  }
}

/**
 * Exports the HelpExceedingArg class
 * @type {HelpExceedingArg}
 */
module.exports = HelpExceedingArg;

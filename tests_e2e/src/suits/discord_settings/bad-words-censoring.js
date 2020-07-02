'use strict';

/**
 * @module bad-words-censoring
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TestCase = require('../../components/test-case');

/**
 * Checks the bad words censoring feature (can add and remove the bad words, enable and disable censoring,
 * and the messages are pre-moderated if the censoring is on).
 * @extends TestCase
 * @alias BadWordsCensoring
 */
class BadWordsCensoring extends TestCase {
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

    channel.send('!addbadwords badword1, badword2, badword3, badword4');
    let receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Added 4 words (duplicates are ignored).');

    channel.send('!addbadwords badword1, badword2');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Added 0 words (duplicates are ignored).');

    channel.send('!removebadwords badword1, badword3');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Removed 2 words.');

    channel.send('badword2');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!setcensoring da');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.startsWith(
      'Sorry, could not understand the command. Reason: You did not specify any value for argument:'));

    channel.send('!setcensoring on');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Censoring is enabled.');

    channel.send('bla-bla-bla badword2 blu-blu-blu');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertTrue(receivedMessage.content.indexOf(
      'wrote a message, but for the sake of decency we had to replace it with the following text:') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('bla-bla-bla') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('blu-blu-blu') >= 0);
    this.assertTrue(receivedMessage.content.indexOf('badword2') < 0);
    const messages = await channel.messages.fetch({ limit: 3 });
    const messagesArray = Array.from(messages.values());
    for (const message of messagesArray) {
      this.assertTrue(message.content.indexOf('badword2') < 0);
    }

    channel.send('badword3');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!setcensoring off');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Censoring is disabled.');

    channel.send('badword2');
    receivedMessage = await this.getReply(channel);
    this.assertNull(receivedMessage);

    channel.send('!badwords');
    const receivedMessages = await this.getAllReplies(channel);
    this.assertNotNull(receivedMessages);
    this.assertGreaterThan(receivedMessages.length, 0);
    let totalText = '';
    for (const message of receivedMessages) {
      this.assertNotNull(message.content);
      totalText += message.content;
    }
    this.assertTrue(totalText.startsWith('I will wash my mouth with soap after saying that:'));
    this.assertTrue(totalText.indexOf('badword2') >= 0);
    this.assertTrue(totalText.indexOf('badword4') >= 0);
    this.assertTrue(totalText.indexOf('badword1') < 0);
    this.assertTrue(totalText.indexOf('badword3') < 0);

    channel.send('!removebadwords badword2, badword4');
    receivedMessage = await this.getReply(channel);
    this.assertNotNull(receivedMessage);
    this.assertEquals(receivedMessage.content, 'Removed 2 words.');
  }
}

/**
 * Exports the BadWordsCensoring class
 * @type {BadWordsCensoring}
 */
module.exports = BadWordsCensoring;

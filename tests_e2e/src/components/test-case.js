'use strict';

/**
 * @module test-case
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');

const AssertionError = require('./assertion-error');

const DefaultReplyTimeout = 5000;
const WaitingInterval = 100;

/**
 * Represents a single test case.
 * @alias TestCase
 */
class TestCase {
  /**
   * Initializes the case
   * @param {TestSuit} testSuit the test suit which this case belongs to
   * @param {string}   name     the name of the case (the same as the file name, without .js extension)
   */
  constructor(testSuit, name) {
    this.suit = testSuit;
    this.name = name;
    this.processor = testSuit.casesManager.processor;
    this.waitingForReply = false;
    this.replyMessage = null;
  }

  /**
   * Returns the name of the suit
   * @return {string} the name of the suit (the same as the folder name)
   */
  getName() {
    return this.name;
  }

  /**
   * Executes the test case
   * @return {Promise} nothing (in case of failure - an exception will be thrown)
   */
  async execute() {
    this.processor = this.suit.casesManager.processor;
  }

  /**
   * Waits for a reply on a specific channel
   * @param  {Channel}  channel the channel where the reply message should appear
   * @param  {Number}   timeout the timeout in milliseconds after which an exception will be thrown
   * @return {Object}           the reply message
   */
  async getReply(channel, timeout) {
    this.currentChannel = channel;
    if (timeout === undefined) {
      timeout = DefaultReplyTimeout;
    }
    this.replyMessage = null;
    this.waitingForReply = true;

    const startTime = new Date();
    while (new Date() - startTime < timeout) {
      await this.sleep(WaitingInterval);
      if (this.replyMessage !== null) {
        break;
      }
    }

    this.waitingForReply = false;
    this.currentChannel = null;
    return this.replyMessage;
  }

  /**
   * Handles new message from Discord as a potential reply
   * @param  {Message} message the message from Discord
   */
  onDiscordReply(message) {
    if (!this.waitingForReply ||
      message.author.id !== this.processor.prefsManager.discord_client_to_be_tested ||
      message.channel.id !== this.currentChannel.id) {
      return;
    }

    this.replyMessage = message;
  }

  /**
   * Sleeps the given amount of milliseconds
   * @param  {Number} ms the count of milliseconds to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Asserts that the given object is defined and not null
   * @param  {Object} obj the object to check
   * @throws AssertionError
   */
  assertNotNull(obj) {
    if (obj === undefined || obj === null) {
      throw new AssertionError('assertNotNull failed for the following object: '
        + util.inspect(obj, { showHidden: true, depth: 2 }));
    }
  }

  /**
   * Asserts that the given object is undefined or null
   * @param  {Object} obj the object to check
   * @throws AssertionError
   */
  assertNull(obj) {
    if (obj !== undefined && obj !== null) {
      throw new AssertionError('assertNull failed for the following object: '
        + util.inspect(obj, { showHidden: true, depth: 2 }));
    }
  }

  /**
   * Asserts that the given object is equal to the other given object
   * @param  {Object} obj1 the first object to compare
   * @param  {Object} obj2 the second object to compare
   * @throws AssertionError
   */
  assertEquals(obj1, obj2) {
    if (obj1 !== obj2) {
      throw new AssertionError('assertEquals failed for the following objects: object 1: '
        + util.inspect(obj1, { showHidden: true, depth: 2 })
        + '; object 2: ' + util.inspect(obj2, { showHidden: true, depth: 2 }));
    }
  }
}

/**
 * Exports the TestCase class
 * @type {TestCase}
 */
module.exports = TestCase;

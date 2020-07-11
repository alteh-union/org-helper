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

const DefaultTimeZone = 'Etc/UTC';

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
    this.waitingForAllReplies = false;
    this.replyMessages = null;
  }

  /**
   * Gets the string representing the default timezone.
   * @type {String}
   */
  static get DEFAULT_TIMEZONE() {
    return DefaultTimeZone;
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
   * Waits for all replies within the specified timeframe
   * @param  {Channel}       channel the channel where the reply messages should appear
   * @param  {Number}        timeout the timeframe in milliseconds during which the replies will be received
   * @return {Array<Object>}         the reply messages
   */
  async getAllReplies(channel, timeout) {
    this.currentChannel = channel;
    if (timeout === undefined) {
      timeout = DefaultReplyTimeout;
    }
    this.replyMessages = [];
    this.waitingForAllReplies = true;

    await this.sleep(DefaultReplyTimeout);

    this.waitingForAllReplies = false;
    this.currentChannel = null;
    return this.replyMessages;
  }

  /**
   * Handles new message from Discord as a potential reply
   * @param  {Message} message the message from Discord
   */
  onDiscordReply(message) {
    if (message.author.id === this.processor.prefsManager.discord_client_to_be_tested &&
      message.channel.id === this.currentChannel.id) {
      if (this.waitingForReply) {
        this.replyMessage = message;
      } else if (this.waitingForAllReplies) {
        this.replyMessages.push(message);
      }
    }
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
   * Parses the value for a given setting from a settings/mysettings response of the main Bot
   * @param  {string} settingsResponse the response from the main Bot
   * @param  {string} settingName      the setting to find
   * @param  {string} defaultValue     the default value to be used if the setting is not found
   * @return {string}                  the setting value if found, default value if not found
   */
  getSettingValue(settingsResponse, settingName, defaultValue) {
    const array = settingsResponse.split('\n');
    for (const line of array) {
      if (line.startsWith(settingName + ' : ')) {
        return line.slice((settingName + ' : ').length);
      }
    }
    return defaultValue;
  }

  /**
   * Converts a Date's class month number (0-11) into a text representation of the corresponding month.
   * E.g. 0 -> January, 1 -> February etc.
   * @param  {Number} monthNumber the month's number according to the JS Date class
   * @return {string}             the month's name
   */
  dateMonthToString(monthNumber) {
    switch (monthNumber) {
      case 0:
        return 'January';
      case 1:
        return 'February';
      case 2:
        return 'March';
      case 3:
        return 'April';
      case 4:
        return 'May';
      case 5:
        return 'June';
      case 6:
        return 'July';
      case 7:
        return 'August';
      case 8:
        return 'September';
      case 9:
        return 'October';
      case 10:
        return 'November';
      case 11:
        return 'December';
      default:
        return null;
    }
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

  /**
   * Asserts that the given number is greater than the other given number
   * @param  {Number} num1 the first number to compare (should be the greater one)
   * @param  {Number} num2 the second number to compare
   * @throws AssertionError
   */
  assertGreaterThan(num1, num2) {
    if (num1 === undefined || num1 === null || num1 === '' || isNaN(num1)) {
      throw new AssertionError('assertGreaterThan failed because the first param is not a number: '
        + util.inspect(num1, { showHidden: true, depth: 2 }));
    }
    if (num2 === undefined || num2 === null || num2 === '' || isNaN(num2)) {
      throw new AssertionError('assertGreaterThan failed because the second param is not a number: '
        + util.inspect(num2, { showHidden: true, depth: 2 }));
    }
    if (num1 <= num2) {
      throw new AssertionError('assertGreaterThan failed because num1 is not greater than num2: number 1: '
        + util.inspect(num1, { showHidden: true, depth: 2 })
        + '; number 2: ' + util.inspect(num2, { showHidden: true, depth: 2 }));
    }
  }

  /**
   * Asserts that the given boolean expression result is true
   * @param  {Boolean} expressionResult the result of a boolean expression calculation, true ot false
   * @throws AssertionError
   */
  assertTrue(expressionResult) {
    if (expressionResult !== true) {
      throw new AssertionError('assertTrue failed for the following object: '
        + util.inspect(expressionResult, { showHidden: true, depth: 2 }));
    }
  }
}

/**
 * Exports the TestCase class
 * @type {TestCase}
 */
module.exports = TestCase;

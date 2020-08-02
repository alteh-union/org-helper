'use strict';

/**
 * @module base-source
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DEFAULT_COMMAND_PREFIX = '!';

/**
 * Wrapper class for message sources (like Discord, Slack etc.)
 * @alias BaseSource
 */
class BaseSource {

  /**
   * Creates a source instance with a link to a particular source client (like Discord or Slack).
   * @param {Object} client the client object
   */
  constructor(client) {
    this.client = client;
  }

  /**
   * Replies to the message using a source-dependent class
   * @param   {BaseMessage} message   the base message object
   * @param   {string}      replyText the text to reply with
   * @returns {Promise}               nothing
   */
  async replyToMessage(message, replyText) {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the name of the source
   * @return {string} the name
   */
  get name() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the default command prefix to be recognized by the bot.
   * @return {string} the prefix
   */
  get DEFAULT_COMMAND_PREFIX() {
    return DEFAULT_COMMAND_PREFIX;
  }
}

/**
 * Exports the BaseSource class
 * @type {BaseSource}
 */
module.exports = BaseSource;

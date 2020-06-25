'use strict';

const DEFAULT_COMMAND_PREFIX = '!';

/**
 * Base class for a message sources
 */
class BaseSource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Reply to the message using the source
   * @param message
   * @param replyText
   * @returns {Promise<void>}
   */
  async replyToMessage(message, replyText) {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * String name of the source
   */
  get name() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Default command prefix
   * @returns {string}
   * @constructor
   */
  get DEFAULT_COMMAND_PREFIX() {
    return DEFAULT_COMMAND_PREFIX;
  }
}

module.exports = BaseSource;

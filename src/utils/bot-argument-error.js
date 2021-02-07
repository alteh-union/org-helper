'use strict';

/**
 * @module bot-argument-error
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotPublicError = require('./bot-public-error');

/**
 * Represents an exception which was caused by entering a wrong argument value by the user.
 * @alias BotArgumentError
 * @extends BotPublicError
 */
class BotArgumentError extends BotPublicError {
  /**
   * Creates a error indicating that a wrong value was provided for one of the Bot's command arguments.
   * @param {string}     text        the human-friendly explanation of the error
   * @param {string}     argName     the argument string identifier (name)
   * @param {Number}     errorCode   the numeric identifier of the validation type
   */
  constructor(text, argName, errorCode) {
    super(text);
    this.argName = argName;
    this.errorCode = errorCode;
  }
}

/**
 * Exports the BotArgumentError class
 * @type {BotArgumentError}
 */
module.exports = BotArgumentError;

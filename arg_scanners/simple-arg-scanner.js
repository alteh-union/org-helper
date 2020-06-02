'use strict';

/**
 * @module simple-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const OhUtils = require('../utils/bot-utils');

/**
 * Scans arguments as a single string until the next non-quoted space.
 * @alias SimpleArgScanner
 */
class SimpleArgScanner {
  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}      context     Bot's context
   * @param  {LangManager}  langManager Lang manager of the command
   * @param  {Object}       message     Message's object (source-dependent)
   * @param  {string}       text        Text to be scanned to parse the argument
   * @return {Promise}                  Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    if (text === undefined || text === null || text === '') {
      return {value: null, nextPos: 1};
    }

    // The simple scanner scans the argument until the next space.
    let nextSpace = OhUtils.findFirstNonQuotedIndex(text, ' ');
    if (nextSpace === -1) {
      nextSpace = text.length;
    }

    return {value: text.slice(0, Math.max(0, nextSpace)), nextPos: nextSpace};
  }
}

/**
 * Exports the SimpleArgScanner class
 * @type {SimpleArgScanner}
 */
module.exports = SimpleArgScanner;

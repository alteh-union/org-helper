'use strict';

/**
 * @module quoted-space-array-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const SimpleArgScanner = require('./simple-arg-scanner');

/**
 * Scans arguments as a space-separated array, where each part can be a multi-word phrase in quotes.
 * Spaces inside quotes are not counted as separators.
 * Works greedy, e.g. if used in a consequent scan, then considers the end of the command as the end of argument.
 * @alias QuotedSpaceArrayArgScanner
 * @extends SimpleArgScanner
 */
class QuotedSpaceArrayArgScanner extends SimpleArgScanner {

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}         context     Bot's context
   * @param  {LangManager}     langManager Lang manager of the command
   * @param  {Object}          message     Message's object (source-dependent)
   * @param  {string}          text        Text to be scanned to parse the argument
   * @return {Promise<Object>}             Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    const argText = text.slice(0, Math.max(0, text.length)).trim();
    const pieces = this.split(context, argText);
    return { value: pieces.length > 0 ? pieces : null, nextPos: text.length };
  }

  /**
   * Splits the text into the array and trims the parts.
   * @param  {string} text    The text to be splitted
   * @return {Array}          The result array
   */
  static split(context, text) {
    const nonQuotedSpaces = OhUtils.getNonQuotedIndices(text, ' ');
    const pieces = [];
    if (nonQuotedSpaces.length === 0) {
      pieces.push(text);
      return pieces;
    }

    pieces.push(text.slice(0, nonQuotedSpaces[0]).trim());
    for (let i = 0; i < nonQuotedSpaces.length - 1; i++) {
      pieces.push(text.slice(nonQuotedSpaces[i], nonQuotedSpaces[i + 1]).trim());
    }
    pieces.push(text.slice(nonQuotedSpaces[nonQuotedSpaces.length - 1], text.length).trim());

    return pieces;
  }
}

/**
 * Exports the QuotedSpaceArrayArgScanner class
 * @type {QuotedSpaceArrayArgScanner}
 */
module.exports = QuotedSpaceArrayArgScanner;

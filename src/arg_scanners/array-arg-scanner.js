'use strict';

/**
 * @module array-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const SimpleArgScanner = require('./simple-arg-scanner');

const ARRAY_SEPARATOR = ',';

/**
 * Scans arguments as a comma-separated array.
 * @alias ArrayArgScanner
 * @extends SimpleArgScanner
 */
class ArrayArgScanner extends SimpleArgScanner {
  /**
   * Separator of the array's entities in the argument
   * @type {string}
   */
  static get ARRAY_SEPARATOR() {
    return ARRAY_SEPARATOR;
  }

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}         context     Bot's context
   * @param  {LangManager}     langManager Lang manager of the command
   * @param  {Object}          message     Message's object (source-dependent)
   * @param  {string}          text        Text to be scanned to parse the argument
   * @return {Promise<Object>}             Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    return this.scanAsArray(context, text);
  }

  /**
   * Parses the given text to make an argument as an array.
   * @param  {Context}         context Bot's context
   * @param  {string}          text    Text to be scanned to parse the argument
   * @return {Promise<Object>}         Promise of the parsed object of the argument and how many chars were scanned
   */
  static scanAsArray(context, text) {
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    const endIndex = this.getLastCharIndex(context, text);
    const argText = text.slice(0, Math.max(0, endIndex));
    const pieces = this.split(context, argText);
    return { value: pieces.length > 0 ? pieces : null, nextPos: endIndex };
  }

  /**
   * Returns a char position which can be considered as the last symbol to be parsed for the array.
   * @param  {Context} context Bot's context
   * @param  {string}  text    Text to be scanned
   * @return {number}          The index of the char in the text
   */
  static getLastCharIndex(context, text) {
    if (text === undefined || text === null || text === '') {
      return 0;
    }

    const nonQuotedSpaces = OhUtils.getNonQuotedIndices(text, ' ');
    for (const index of nonQuotedSpaces) {
      if (
        text.slice(index - 1, index) !== this.ARRAY_SEPARATOR &&
        text.slice(index, index + 1) !== this.ARRAY_SEPARATOR
      ) {
        return index;
      }
    }

    return text.length;
  }

  /**
   * Splits the text into the array and trims the parts.
   * @param  {string} text    The text to be splitted
   * @return {Array}          The result array
   */
  static split(context, text) {
    const pieces = text.split(this.ARRAY_SEPARATOR);
    for (let i = 0; i < pieces.length; i++) {
      pieces[i] = pieces[i].trim();
    }

    return pieces;
  }
}

/**
 * Exports the ArrayArgScanner class
 * @type {ArrayArgScanner}
 */
module.exports = ArrayArgScanner;

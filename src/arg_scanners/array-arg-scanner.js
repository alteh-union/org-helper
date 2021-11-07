'use strict';

/**
 * @module array-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const SimpleArgScanner = require('./simple-arg-scanner');
const ScannerUiType = require('./scanner-ui-type');

const ARRAY_SEPARATOR = ',';

/**
 * Scans arguments as a comma-separated array.
 * @alias ArrayArgScanner
 * @extends SimpleArgScanner
 */
class ArrayArgScanner extends SimpleArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.arrayType;
  }

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
   * @param  {string}          scanType    The type of scan (by name, sequential etc.)
   * @return {Promise<Object>}             Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text, scanType) {
    return this.scanAsArray(context, text, scanType);
  }

  /**
   * Parses the given text to make an argument as an array.
   * @param  {Context}         context  Bot's context
   * @param  {string}          text     Text to be scanned to parse the argument
   * @param  {string}          scanType The type of scan (by name, sequential etc.)
   * @return {Promise<Object>}          Promise of the parsed object of the argument and how many chars were scanned
   */
  static scanAsArray(context, text, scanType) {
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    const endIndex = this.getLastCharIndex(text, scanType);
    const argText = text.slice(0, Math.max(0, endIndex));
    const pieces = this.split(argText);
    return { value: pieces.length > 0 ? pieces : null, nextPos: endIndex };
  }

  /**
   * Returns a char position which can be considered as the last symbol to be parsed for the array.
   * @param  {string}  text     Text to be scanned
   * @param  {string}  scanType The type of scan (by name, sequential etc.)
   * @return {number}           The index of the char in the text
   */
  static getLastCharIndex(text, scanType) {
    if (text === undefined || text === null || text === '') {
      return 0;
    }
    if (scanType === this.SCAN_TYPES.byName) {
      return text.length;
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
  static split(text) {
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

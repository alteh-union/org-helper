'use strict';

/**
 * @module space-based-array-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const ArrayArgScanner = require('./array-arg-scanner');

const ScannerUiType = require('./scanner-ui-type');

const SPACE_SEPARATOR = ' ';

/**
 * Scans argument as a space-separated array.
 * @alias SpaceBasedArrayArgScanner
 * @extends ArrayArgScanner
 */
class SpaceBasedArrayArgScanner extends ArrayArgScanner {
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
    return SPACE_SEPARATOR;
  }

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}         context     Bot's context
   * @param  {LangManager}     langManager Lang manager of the command
   * @param  {BaseMessage}     message     Message's object (source-dependent)
   * @param  {string}          text        Text to be scanned to parse the argument
   * @param  {string}          scanType    The type of scan (by name, sequential etc.)
   * @return {Promise<Object>}             Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text, scanType) {
    return this.scanAsArray(context, text, scanType);
  }

  /**
   * Returns a char position which can be considered as the last symbol to be parsed for the array.
   * @param  {string}  text     Text to be scanned
   * @param  {string}  scanType The type of scan (by name, sequential etc.)
   * @return {number}           The index of the char in the text
   */
  static getLastCharIndex(text, scanType) {
    if (text === undefined || text === null) {
      return 0;
    }
    return text.length;
  }
}

/**
 * Exports the SpaceBasedArrayArgScanner class
 * @type {SpaceBasedArrayArgScanner}
 */
module.exports = SpaceBasedArrayArgScanner;

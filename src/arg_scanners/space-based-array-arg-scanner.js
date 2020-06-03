'use strict';

/**
 * @module space-based-array-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const ArrayArgScanner = require('./array-arg-scanner');

const SPACE_SEPARATOR = ' ';

/**
 * Scans argument as a space-separated array.
 * @alias SpaceBasedArrayArgScanner
 * @extends ArrayArgScanner
 */
class SpaceBasedArrayArgScanner extends ArrayArgScanner {
  /**
   * Separator of the array's entities in the argument
   * @type {string}
   */
  static get ARRAY_SEPARATOR() {
    return SPACE_SEPARATOR;
  }

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}      context     Bot's context
   * @param  {LangManager}  langManager Lang manager of the command
   * @param  {Object}       message     Message's object (source-dependent)
   * @param  {string}       text        Text to be scanned to parse the argument
   * @return {Promise}                  Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    return this.scanAsArray(context, text);
  }

  /**
   * Returns a char position which can be considered as the last symbol to be parsed for the array.
   * @param  {Context} context Bot's context
   * @param  {string}  text    Text to be scanned
   * @return {number}          The index of the char in the text
   */
  static getLastCharIndex(context, text) {
    return text.length;
  }
}

/**
 * Exports the SpaceBasedArrayArgScanner class
 * @type {SpaceBasedArrayArgScanner}
 */
module.exports = SpaceBasedArrayArgScanner;

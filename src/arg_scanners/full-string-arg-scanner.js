'use strict';

/**
 * @module full-string-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const SimpleArgScanner = require('./simple-arg-scanner');
const ScannerUiType = require('./scanner-ui-type');

/**
 * Scans argument as a string. Consumes the full length of the given text string.
 * @alias FullStringArgScanner
 * @extends SimpleArgScanner
 */
class FullStringArgScanner extends SimpleArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.fullStringType;
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
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    return { value: text, nextPos: text.length };
  }
}

/**
 * Exports the FullStringArgScanner class
 * @type {FullStringArgScanner}
 */
module.exports = FullStringArgScanner;

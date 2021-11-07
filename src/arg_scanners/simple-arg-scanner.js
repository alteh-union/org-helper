'use strict';

/**
 * @module simple-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const ScannerUiType = require('./scanner-ui-type');

const ScanTypes = Object.freeze({
  byName: 'byName',
  sequential: 'sequential'
});

/**
 * Scans arguments as a single string until the next non-quoted space.
 * @alias SimpleArgScanner
 */
class SimpleArgScanner {
  /**
   * Gets the possible types of scanning. Parsing of the given text will depend on the scan type.
   * @return {Object} the types
   */
  static get SCAN_TYPES() {
    return ScanTypes;
  }

  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.stringType;
  }

  /**
   * Returns the command class which can be used to get suggestions on input for this kind of argument.
   * @return {constructor} the command class
   */
  static getSuggestionsCommand() {
    return null;
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
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    let nextArgPos = text.length;
    if (scanType === ScanTypes.sequential) {
      // The simple scanner scans the argument until the next space.
      const nextSpace = OhUtils.findFirstNonQuotedIndex(text, ' ');
      if (nextSpace !== -1) {
        nextArgPos = nextSpace;
      }
    }

    return { value: text.slice(0, Math.max(0, nextArgPos)), nextPos: nextArgPos };
  }
}

/**
 * Exports the SimpleArgScanner class
 * @type {SimpleArgScanner}
 */
module.exports = SimpleArgScanner;

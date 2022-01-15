'use strict';

/**
 * @module boolean-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const SimpleArgScanner = require('./simple-arg-scanner');
const ScannerUiType = require('./scanner-ui-type');

/**
 * Scans arguments as a boolean variable.
 * @alias BooleanArgScanner
 * @extends SimpleArgScanner
 */
class BooleanArgScanner extends SimpleArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.booleanType;
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

    let nextSpace = OhUtils.findFirstNonQuotedIndex(text, ' ');
    if (nextSpace === -1) {
      nextSpace = text.length;
    }

    const textValue = text.slice(0, Math.max(0, nextSpace));
    let value = null;
    if (
      textValue === langManager.getString('arg_boolean_on') ||
      textValue === langManager.getString('arg_boolean_true')
    ) {
      value = true;
    } else if (
      textValue === langManager.getString('arg_boolean_off') ||
      textValue === langManager.getString('arg_boolean_false')
    ) {
      value = false;
    }

    return { value, nextPos: value === null ? 1 : nextSpace };
  }
}

/**
 * Exports the BooleanArgScanner class
 * @type {BooleanArgScanner}
 */
module.exports = BooleanArgScanner;

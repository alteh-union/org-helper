'use strict';

/**
 * @module object-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const SimpleArgScanner = require('./simple-arg-scanner');
const ScannerWebUiType = require('./scanner-web-ui-type');

const PROPERTIES_SEPARATOR = ';';
const PROPERTY_NAME_SEPARATOR = ':';

/**
 * Scans arguments as an object with arbitrary properties.
 * @alias ObjectArgScanner
 * @extends SimpleArgScanner
 */
class ObjectArgScanner extends SimpleArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in the Web interface.
   * @return {string} the type identifier
   */
  static getWebUiType() {
    return ScannerWebUiType.objectType;
  }

  /**
   * Separator of the object's properties in the argument
   * @type {string}
   */
  static get PROPERTIES_SEPARATOR() {
    return PROPERTIES_SEPARATOR;
  }

  /**
   * Separator between a property's name and property's value.
   * @type {string}
   */
  static get PROPERTY_NAME_SEPARATOR() {
    return PROPERTY_NAME_SEPARATOR;
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
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    // Determining where the object ends. Since we cannot use quotes to indicate the beginning and the end
    // of the object, we try to find the last property's name-value separator and consider
    // the last character of the object as the first space after the last separator.
    // After we know where the object's string ends, we can easily split it using the properties separator,
    // and then for each property - determine its name and value via the name-value separator.
    let lastPropertySeparator = OhUtils.findLastNonQuotedIndex(text, PROPERTY_NAME_SEPARATOR);

    if (lastPropertySeparator === -1) {
      return { value: null, nextPos: 1 };
    }

    if (text.slice(lastPropertySeparator, lastPropertySeparator + 1) === ' ') {
      lastPropertySeparator++;
    }

    const afterLastSeparator = text.slice(lastPropertySeparator + 1, text.length);
    const firstSpaceAfterLastSeparator = OhUtils.findFirstNonQuotedIndex(afterLastSeparator, ' ');
    let lastSpaceIndex = Math.min(text.length, lastPropertySeparator + 1 + firstSpaceAfterLastSeparator);
    if (firstSpaceAfterLastSeparator === -1) {
      lastSpaceIndex = text.length;
    }

    const objectText = text.slice(0, lastSpaceIndex);

    const pieces = this.split(context, objectText);

    const argObject = {};
    for (const piece of pieces) {
      if (OhUtils.findFirstNonQuotedIndex(piece, PROPERTY_NAME_SEPARATOR) === -1) {
        continue;
      }
      const nameValuePair = piece.split(PROPERTY_NAME_SEPARATOR);
      if (nameValuePair.length > 2) {
        continue;
      }
      nameValuePair[0] = nameValuePair[0].trim();
      nameValuePair[1] = nameValuePair[1].trim();

      // removing technical quotes from the begining and the end of the parameter
      nameValuePair[1] = nameValuePair[1].replace(/^"(.*)"$/, '$1');

      argObject[nameValuePair[0]] = nameValuePair[1];
    }

    return { value: argObject, nextPos: lastSpaceIndex };
  }

  /**
   * Splits the text into the array and trims the parts.
   * @param  {string} text    The text to be splitted
   * @return {Array}          The result array
   */
  static split(context, text) {
    const pieces = text.split(PROPERTIES_SEPARATOR);
    for (let i = 0; i < pieces.length; i++) {
      pieces[i] = pieces[i].trim();
    }

    return pieces;
  }
}

/**
 * Exports the ObjectArgScanner class
 * @type {ObjectArgScanner}
 */
module.exports = ObjectArgScanner;

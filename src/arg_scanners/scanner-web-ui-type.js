'use strict';

/**
 * @module scanner-web-ui-type
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const WebUiTypes = Object.freeze({
  stringType: 'string',
  arrayType: 'array',
  booleanType: 'boolean',
  timeType: 'time',
  objectType: 'object',
  channelsType: 'channels',
  subjectsType: 'subjects',
  mentionsType: 'mentions'
});

/**
 * Provides the list of possible Web UI types for scanner.
 * Web representation of command arguments depends on the this.
 * @alias ScannerWebUiType
 */
class ScannerWebUiType {
  /**
   * Gets the array of possible Web UI types
   * @type {string}
   */
  static get TYPES() {
    return WebUiTypes;
  }
}

/**
 * Exports the ScannerWebUiType class
 * @type {ScannerWebUiType}
 */
module.exports = ScannerWebUiType;

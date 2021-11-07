'use strict';

/**
 * @module scanner-web-ui-type
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const UiTypes = Object.freeze({
  stringType: 'string',
  fullStringType: 'string',
  arrayType: 'array',
  booleanType: 'boolean',
  timeType: 'time',
  objectType: 'object',
  channelsType: 'array',
  subjectsType: 'array',
  mentionsType: 'array'
});

/**
 * Provides the list of possible UI (Web, Android etc.) types for scanner.
 * Web representation of command arguments depends on the this.
 * @alias ScannerUiType
 */
class ScannerUiType {
  /**
   * Gets the array of possible UI types
   * @type {string}
   */
  static get TYPES() {
    return UiTypes;
  }
}

/**
 * Exports the ScannerUiType class
 * @type {ScannerUiType}
 */
module.exports = ScannerUiType;

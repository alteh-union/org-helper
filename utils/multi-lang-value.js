'use strict';

/**
 * @module multi-lang-value
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

/**
  * Util class representing a UI variable which can have different value depending on locale.
  * @alias MultiLangValue
  */
class MultiLangValue {
  /**
   * Constructs an instance of the class
   * @param {string} name   the name of the variable
   * @param {string} textId text id from the localization JSONs
   */
  constructor(name, textId) {
    this.name = name;
    this.textId = textId;
  }
}

/**
 * Exports the MultiLangValue class
 * @type {MultiLangValue}
 */
module.exports = MultiLangValue;

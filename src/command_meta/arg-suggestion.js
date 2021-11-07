'use strict';

/**
 * @module arg-suggestion
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Represents a suggestion for user input for a command argument.
 * @alias ArgSuggestion
 */
class ArgSuggestion {

  /**
   * Creates an argument suggestion with the actual value (id) and a human-friendly description of it.
   * @param {string} id          the identifier of the suggestion
   * @param {string} description the description of the suggestion
   */
  constructor(id, description) {
    this.id = id;
    this.description = description;
  }
}

/**
 * Exports the ArgSuggestion class
 * @type {ArgSuggestion}
 */
module.exports = ArgSuggestion;

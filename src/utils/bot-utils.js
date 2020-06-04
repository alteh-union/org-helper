'use strict';

/**
 * @module bot-utils
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const stringSimilarity = require('string-similarity');

const MongoProtocol = 'mongodb';

const QuotesSymbols = Object.freeze(['"', "'"]);
const DefaultIdColumn = 'id';
const AnyValue = '-1';
const MaxInt32 = 2147483647;
const OnValue = 'on';
const OffValue = 'off';
const EuphemismTemplate = '$%*!@&';
const DefaultMaxSuggestions = 10;
const DefaultRandomStringLength = 5;

/**
 * General utils.
 * @alias Utils
 */
class Utils {
  /**
   * String representing "any value" (in the database, for permmissions check etc.)
   * @type {string}
   */
  static get ANY_VALUE() {
    return AnyValue;
  }

  /**
   * Max int32 signed number (used for procedures limited by the system)
   * @type {number}
   */
  static get MAX_INT32() {
    return MaxInt32;
  }

  /**
   * Max time in millisecinds used for "setTimeout" procedure
   * @type {number}
   */
  static get MAX_TIMEOUT() {
    return this.MAX_INT32;
  }

  /**
   * Internal representation of "enabled" value of settings etc.
   * @type {string}
   */
  static get ON() {
    return OnValue;
  }

  /**
   * Internal representation of "disabled" value of settings etc.
   * @type {string}
   */
  static get OFF() {
    return OffValue;
  }

  /**
   * Set of characters to be used for replacing bad words.
   * @type {string}
   */
  static get EUPHEMISM_TEMPLATE() {
    return EuphemismTemplate;
  }

  /**
   * Makes a connection string for a Mongo DB based on the bot's preference
   * @param  {PrefsManager} prefsManager preferences manager
   * @return {string}                    the result connection string
   */
  static makeDbConnectionString(prefsManager) {
    if (prefsManager.db_host === undefined || prefsManager.db_name === undefined) {
      return '';
    }

    let result = MongoProtocol + '://';
    if (prefsManager.db_username !== undefined) {
      result += prefsManager.db_username;
      if (prefsManager.db_password !== undefined) {
        result += ':' + prefsManager.db_password;
      }

      result += '@';
    }

    result += prefsManager.db_host;
    if (prefsManager.db_port !== undefined) {
      result += ':' + prefsManager.db_port;
    }

    result += '/' + prefsManager.db_name;
    return result;
  }

  /**
   * Checks if the object is empty, not considering its inherited properties, methods etc.
   * @param  {Object}  obj the object to check
   * @return {Boolean}     true if the object is empty
   */
  static isEmpty(object) {
    for (const prop in object) {
      if (Object.prototype.hasOwnProperty.call(object, prop)) {
        return false;
      }
    }

    return JSON.stringify(object) === JSON.stringify({});
  }

  /**
   * Quotes symbols to keep integrity of string arguments etc.
   * @return {Array<string>} the array of pre-defined quote symbols
   */
  static getQuoteSymbols() {
    return QuotesSymbols;
  }

  /**
   * Gets the array of indices for a given substring in a text
   * @param  {string}        text      text to search in
   * @param  {string}        substring text, which indices you need to find
   * @return {Array<number>}           array of found indices
   */
  static getIndices(text, substring) {
    const searchStringLength = substring.length;
    if (searchStringLength === 0) {
      return [];
    }

    let startIndex = 0;
    let index;
    const indices = [];
    while ((index = text.indexOf(substring, startIndex)) > -1) {
      indices.push(index);
      startIndex = index + searchStringLength;
    }

    return indices;
  }

  /**
   * Check if text at the specified index is in quotes.
   * @see Utils.getQuoteSymbols
   * @param  {string}  text  the text to check
   * @param  {number}  index position in the text
   * @return {Boolean}       true if quoted, false otherwise
   */
  static isPlaceQuoted(text, index) {
    const textBefore = text.slice(0, Math.max(0, index));
    const quoteSymbols = Utils.getQuoteSymbols();
    for (const element of quoteSymbols) {
      if (Utils.getIndices(textBefore, element).length % 2 === 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets the first index where the given substring exists and not quoted.
   * @param  {string} text      the text to search in
   * @param  {string} substring the text to find, results for the quotes themselves are undefined
   * @return {number}           the index of the first non-quoted place with the string
   */
  static findFirstNonQuotedIndex(text, substring) {
    const indices = Utils.getIndices(text, substring);
    for (const element of indices) {
      if (!Utils.isPlaceQuoted(text, element)) {
        return element;
      }
    }

    return -1;
  }

  /**
   * Gets the array of indices where the given substring exists and not quoted.
   * @param  {string}        text    the text to search in
   * @param  {string}        subtext the text to find, results for the quotes themselves are undefined
   * @return {Array<number>}         the array of indices
   */
  static getNonQuotedIndices(text, subtext) {
    const indices = Utils.getIndices(text, subtext);
    return indices.filter(value => {
      return !Utils.isPlaceQuoted(text, value);
    });
  }

  /**
   * Splits the given text based on un-quoted spaces. Removes duplicate spaces before that.
   * @param  {text}          text the text to be splitted
   * @return {Array<string>}      splitted array of arguments, trimmed
   */
  static splitForArguments(text) {
    const trimmedText = Utils.dry(text);
    const indicesNotInQuotes = Utils.getNonQuotedIndices(trimmedText, ' ');
    const args = [];
    for (let i = 0; i < indicesNotInQuotes.length - 1; i++) {
      args.push(trimmedText.slice(indicesNotInQuotes[i], indicesNotInQuotes[i + 1]).trim());
    }

    if (indicesNotInQuotes.length > 0) {
      args.push(trimmedText.slice(indicesNotInQuotes[indicesNotInQuotes.length - 1], trimmedText.length).trim());
    }

    return args;
  }

  /**
   * Converted multiple spaces in a row into a single space.
   * @param  {string} text the text to be dried
   * @return {string}      the dried text
   */
  static dry(text) {
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Get the max id of the collection, given the name of the id's property
   * @param  {Array<Object>} arrayCollection the collection to check
   * @param  {string}        idColumn        the name of id column (skip to use the default variant)
   * @return {number}                        the max id, 0 if the ids are not found in the collection
   */
  static findMaxId(arrayCollection, idColumn) {
    if (idColumn === undefined) {
      idColumn = DefaultIdColumn;
    }

    let maxId = 0;
    for (const element of arrayCollection) {
      if (element[idColumn] > maxId) {
        maxId = element[idColumn];
      }
    }

    return maxId;
  }

  /**
   * Makes an euphemism of random symbols of the given length.
   * @param  {number} length the target length of the euphemism
   * @return {string}        the result euphemism string
   */
  static makeEuphemism(length) {
    return this.makeRandomString(EuphemismTemplate, length);
  }

  /**
   * Makes a string of random symbols of the given length.
   * @param  {string} availableCharsString the collection of symbols to make the string from
   * @param  {number} length               the target length of the euphemism
   * @return {string}                      the result euphemism string, empty of no collection provided
   */
  static makeRandomString(availableCharsString, length) {
    let result = '';
    if (availableCharsString === undefined) {
      return result;
    }

    if (length === undefined) {
      length = DefaultRandomStringLength;
    }

    const charactersLength = availableCharsString.length;
    for (let i = 0; i < length; i++) {
      result += availableCharsString.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  /**
   * Makes an array of suggestions based on the similarity to the given string, sorts in the order of similarity.
   * @param  {string}        text                 the target text
   * @param  {Array<string>} availableSuggestions the array of available suggestions
   * @param  {number}        maxSuggestions       max number of suggestions to make
   * @return {Array<string>}                      the sorted array of suggestions
   */
  static makeSuggestions(text, availableSuggestions, maxSuggestions) {
    if (maxSuggestions === undefined || maxSuggestions <= 0) {
      maxSuggestions = DefaultMaxSuggestions;
    }

    const suggestions = [];
    const ratings = stringSimilarity.findBestMatch(text, availableSuggestions).ratings;
    ratings.sort((a, b) => (a.rating > b.rating ? -1 : b.rating > a.rating ? 1 : 0));

    for (let i = 0; i < maxSuggestions; i++) {
      suggestions.push(ratings[i].target);
    }

    return suggestions;
  }
}

/**
 * Exports the Utils class
 * @type {Utils}
 */
module.exports = Utils;

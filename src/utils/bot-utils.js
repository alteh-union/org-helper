'use strict';

/**
 * @module bot-utils
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const fs = require('fs');
const path = require('path');
const request = require('request');
const stringSimilarity = require('string-similarity');

const MongoProtocol = 'mongodb';

const QuotesSymbols = Object.freeze(['"', "'"]);
const DefaultIdColumn = 'id';
const AnyValue = '-1';
const MaxInt32 = 2147483647;
const OnValue = 'on';
const OffValue = 'off';
const EuphemismTemplate = '?%*!@&';
const DefaultMaxSuggestions = 10;
const DefaultRandomStringLength = 5;
const DefaultMaxComplexityLimit = 1000;

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
   * Gets the last index where the given substring exists and not quoted.
   * @param  {string} text      the text to search in
   * @param  {string} substring the text to find, results for the quotes themselves are undefined
   * @return {number}           the index of the last non-quoted place with the string
   */
  static findLastNonQuotedIndex(text, substring) {
    const indices = Utils.getIndices(text, substring);
    for (let i = indices.length - 1; i >= 0; i--) {
      if (!Utils.isPlaceQuoted(text, indices[i])) {
        return indices[i];
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

  /**
   * Calculates the total complexity of a given object, considering all its properties on all levels of depth.
   * However, stops at the limit.
   * @param  {Object} object     the object to inspect
   * @param  {Number} limit      the limit (to save time and to avoid indefinite loops)
   * @param  {Object} complexity the object to pass the complexity by reference, must contain "value" numeric field
   * @return {Number}            the total complexity of the object
   */
  static calculateComplexity(object, limit, complexity) {
    if (complexity === undefined) {
      complexity = { value: 1 };
    }
    if (limit === undefined || typeof limit !== 'number' || limit > DefaultMaxComplexityLimit) {
      limit = DefaultMaxComplexityLimit;
    }

    if (complexity.value > limit) {
      return complexity.value;
    }

    for (var key in object) {
      complexity.value++;
      if (typeof object[key] === 'object') {
        this.calculateComplexity(object[key], limit, complexity);
      }
    }

    return complexity.value;
  }

  /**
   * Deletes a file at a given path.
   * @private
   * @param  {string}  filePath the file path
   * @param  {Log}     log      the Logs manager to save result/errors of the operation
   * @return {Promise}          nothing
   */
  static async deleteFile(filePath, log) {
    await fs.unlink(filePath, (err) => {
      if (err) {
        log.e('Delete error: ' + err);
      } else {
        log.v(`File ${filePath} deleted successfully`);
      }
    });
  }

  /**
   * Downloads a file if it's content length is below a specified limit in bytes.
   * @private
   * @param  {string}  url           the URL of the remote file to be downloaded
   * @param  {string}  filePath      the local path to save the file into
   * @param  {Number}  fileSizeLimit the size limit in bytes
   * @param  {Log}     log      the Logs manager to save result/errors of the operation
   * @return {Promise}               nothing
   */
  static async downloadFileWithSizeLimit(url, filePath, fileSizeLimit, log) {
    log.d(`Download file ${url} to ${filePath}`);
    const downloadFunc = (url, filePath, resolve, reject) => {
      request({
        url: url,
        method: 'HEAD'
      }, (err, headRes) => {
        if (err) {
          log.e(`BotUtils: downloadFileWithSizeLimit - HEAD request failed for ${url}`);
          reject(err.message);
          return;
        }

        if (headRes.headers['content-length'] && headRes.headers['content-length']
          > Number.parseInt(fileSizeLimit, 10)) {
          log.e(`BotUtils: downloadFileWithSizeLimit - file size exceeds limit ${headRes.headers['content-length']}`);
          reject('File size exceeds limit (' + headRes.headers['content-length'] + ')');

        } else {
          if (headRes.headers['content-length']) {
            log.v(`BotUtils: downloadFileWithSizeLimit - file size ${url} is ${headRes.headers['content-length']}`);
          }

          const file = fs.createWriteStream(filePath);
          const res = request({ url: url });
          let size = 0;

          res.on('response', (response) => {
            if (response.statusCode !== 200) {
              reject('Response status was ' + response.statusCode);
            }
          });

          res.on('error', (err) => {
            this.deleteFile(filePath, log);
            reject(err.message);
          });

          res.on('data', (data) => {
            size += data.length;
            if (size > Number.parseInt(fileSizeLimit, 10)) {
              log.e('BotUtils: downloadFileWithSizeLimit - resource stream exceeded limit (' + size + ')');
              res.abort(); // Abort the response (close and cleanup the stream)
              this.deleteFile(filePath, log);
              reject('File size  exceeds limit');

            }
          }).pipe(file);

          file.on('error', (err) => { // Handle errors
            log.e(`BotUtils: downloadFileWithSizeLimit - file error ${err}`);
            this.deleteFile(filePath, log);
            reject(err.message);
          });

          file.on('finish', () => file.close(resolve));
        }
      });
    };
    return new Promise((resolve, reject) => downloadFunc(url, filePath, resolve, reject));
  }

  /**
   * Downloads a page by its URL as a text. Also can download text files directly.
   * Do not use to download raw images.
   * @param  {string}  url the URL to download the page from
   * @return {Promise}     the page body as text, if successful, Error otherwise
   */
  static downloadPage(url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (error) reject(error);
        if (response.statusCode !== 200) {
          reject(new Error('Invalid status code <' + response.statusCode + '>'));
        }

        resolve(body);
      });
    });
  }

  /**
   * Gets the count of files in a specific folder with specific prefix in the file names.
   * @param  {string}          folder the path to the folder
   * @param  {string}          prefix the prefix to be searched for
   * @return {Promise<Number>}        the count of files
   */
  static async getFilesCountByPrefix(folder, prefix) {
    return fs.readdirSync(folder, { withFileTypes: true })
      .filter(fileEntity => fileEntity.name.startsWith(prefix) && !fileEntity.isDirectory()).length;
  }

  /**
   * Deletes files in a specific folder with specific prefix in the file names.
   * @param  {string}  folder the path to the folder
   * @param  {string}  prefix the prefix to be searched for
   * @param  {Log}     log    the Log manager to report errors, if any
   * @return {Promise}        nothing
   */
  static async deleteFilesByPrefix(folder, prefix, log) {
    const fileNames = fs.readdirSync(folder, { withFileTypes: true })
      .filter(fileEntity => fileEntity.name.startsWith(prefix) && !fileEntity.isDirectory())
      .map(fileEntity => fileEntity.name);

    for (const fileName of fileNames) {
      const filePath = path.join(folder, fileName);
      await fs.unlink(filePath, (err) => {
        if (err) {
          log.e(`Bot Utils, deleteFilesByPrefix: Failed to delete file ${filePath}. Error: ${err}`);
          throw err;
        }
      });
    }
  }
}

/**
 * Exports the Utils class
 * @type {Utils}
 */
module.exports = Utils;

'use strict';

/**
 * @module discord-mentions-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const DiscordUtils = require('../utils/discord-utils');

const ArrayArgScanner = require('./array-arg-scanner');

/**
 * Scans arguments as a an array of ids from a comma separated list of Discord mentions.
 * Abstract.
 * @abstract
 * @alias DiscordMentionsArgScanner
 * @extends ArrayArgScanner
 */
class DiscordMentionsArgScanner extends ArrayArgScanner {
  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}      context     Bot's context
   * @param  {LangManager}  langManager Lang manager of the command
   * @param  {Object}       message     Message's object (source-dependent)
   * @param  {string}       text        Text to be scanned to parse the argument
   * @return {Promise}                  Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('scan: ' + this.name + ' is an abstract class');
  }

  /**
   * Parses Discord mentions (channels, roles, members) using the specified prefix into ids.
   * @param  {string}        argText the text to be parsed
   * @param  {string}        prefix  the prefix to remove from the mention to get the pure id
   * @return {Array<string>}         the array of parsed identifiers
   */
  static parseDiscordMentions(argText, prefix) {
    const parsedMentions = [];
    const mentions = argText.split(this.ARRAY_SEPARATOR);
    for (let i = 0; i < mentions.length; i++) {
      mentions[i] = mentions[i].trim();

      if (/^\d+$/.test(mentions[i])) {
        parsedMentions.push(mentions[i]);
        continue;
      }

      if (
        !mentions[i].startsWith(DiscordUtils.DISCORD_MENTION_START) ||
        !mentions[i].endsWith(DiscordUtils.DISCORD_MENTION_END)
      ) {
        continue;
      }

      mentions[i] = mentions[i].slice(1, -1);

      if (!mentions[i].startsWith(prefix)) {
        continue;
      }

      mentions[i] = mentions[i].slice(prefix.length);

      if (!/^\d+$/.test(mentions[i])) {
        continue;
      }

      parsedMentions.push(mentions[i]);
    }

    return parsedMentions;
  }
}

/**
 * Exports the DiscordMentionsArgScanner class
 * @type {DiscordMentionsArgScanner}
 */
module.exports = DiscordMentionsArgScanner;

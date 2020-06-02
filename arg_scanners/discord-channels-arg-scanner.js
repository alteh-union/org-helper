'use strict';

/**
 * @module discord-channels-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const OhUtils = require('../utils/bot-utils');

const DiscordCommand = require('../commands_discord/discord-command');
const DiscordUtils = require('../utils/discord-utils');
const DiscordMentionsArgScanner = require('./discord-mentions-arg-scanner');
const DiscordChannelsArg = require('../command_meta/discord-channels-arg');

/**
 * Scans arguments as a an array of channel ids from a comma separated list of Discord mentions.
 * @alias DiscordChannelsArgScanner
 * @extends DiscordMentionsArgScanner
 */
class DiscordChannelsArgScanner extends DiscordMentionsArgScanner {
  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}      context     Bot's context
   * @param  {LangManager}  langManager Lang manager of the command
   * @param  {Object}       message     Message's object (source-dependent)
   * @param  {string}       text        Text to be scanned to parse the argument
   * @return {Promise}                  Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    const lastIndex = this.getLastCharIndex(context, text);
    if (lastIndex === 0) {
      return {value: null, nextPos: 1};
    }

    const argText = text.slice(0, Math.max(0, lastIndex));
    let argValue = null;
    if (argText !== null && argText !== '') {
      if (argText === langManager.getString(DiscordCommand.ANY_VALUE_TEXT)) {
        argValue = new DiscordChannelsArg([OhUtils.ANY_VALUE]);
      } else {
        argValue = this.parseDiscordChannelArg(argText);
      }
    }

    return {value: argValue, nextPos: lastIndex};
  }

  /**
   * Parses the argument text into an array of ids for Discord channels.
   * Does not parse "any" value - it should be parsed separately.
   * @param  {string}             argText the text to be parsed
   * @return {DiscordChannelsArg}         the array of channels
   */
  static parseDiscordChannelArg(argText) {
    return new DiscordChannelsArg(this.parseDiscordMentions(argText, DiscordUtils.DISCORD_CHANNEL_PREFIX));
  }
}

/**
 * Exports the DiscordChannelsArgScanner class
 * @type {DiscordChannelsArgScanner}
 */
module.exports = DiscordChannelsArgScanner;

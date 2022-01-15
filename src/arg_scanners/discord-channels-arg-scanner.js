'use strict';

/**
 * @module discord-channels-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const Command = require('../commands/command');
const GetChannelSuggestions = require('../commands/suggestions/get-channel-suggestions');
const DiscordUtils = require('../utils/discord-utils');
const DiscordMentionsArgScanner = require('./discord-mentions-arg-scanner');
const DiscordChannelsArg = require('../command_meta/discord-channels-arg');
const ScannerUiType = require('./scanner-ui-type');

/**
 * Scans arguments as a an array of channel ids from a comma separated list of Discord mentions.
 * @alias DiscordChannelsArgScanner
 * @extends DiscordMentionsArgScanner
 */
class DiscordChannelsArgScanner extends DiscordMentionsArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in the UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.channelsType;
  }

  /**
   * Returns the command class which can be used to get suggestions on input for this kind of argument.
   * @return {constructor} the command class
   */
  static getSuggestionsCommand() {
    return GetChannelSuggestions;
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
    const lastIndex = this.getLastCharIndex(text, scanType);
    if (lastIndex === 0) {
      return { value: null, nextPos: 1 };
    }

    const argText = text.slice(0, Math.max(0, lastIndex));
    let argValue = null;
    if (argText !== null && argText !== '') {
      if (argText === langManager.getString(Command.ANY_VALUE_TEXT)) {
        argValue = new DiscordChannelsArg([OhUtils.ANY_VALUE]);
      } else {
        argValue = await this.parseDiscordChannelArg(context, message, argText);
      }
    }

    return { value: argValue, nextPos: lastIndex };
  }

  /**
   * Parses the argument text into an array of ids for Discord channels.
   * Does not parse "any" value - it should be parsed separately.
   * @param  {Context}            context Bot's context
   * @param  {BaseMessage}        message Message's object (source-dependent)
   * @param  {string}             argText the text to be parsed
   * @return {DiscordChannelsArg}         the array of channels
   */
  static async parseDiscordChannelArg(context, message, argText) {
    return new DiscordChannelsArg(await this.parseDiscordMentions(context, message, argText,
      DiscordUtils.DISCORD_CHANNEL_PREFIX, DiscordUtils.MENTION_TYPES.channel));
  }
}

/**
 * Exports the DiscordChannelsArgScanner class
 * @type {DiscordChannelsArgScanner}
 */
module.exports = DiscordChannelsArgScanner;

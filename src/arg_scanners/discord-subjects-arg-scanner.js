'use strict';

/**
 * @module discord-subjects-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */
const OhUtils = require('../utils/bot-utils');

const Command = require('../commands/command');
const GetSubjectSuggestions = require('../commands/suggestions/get-subject-suggestions');
const DiscordUtils = require('../utils/discord-utils');
const DiscordMentionsArgScanner = require('./discord-mentions-arg-scanner');
const DiscordSubjectsArg = require('../command_meta/discord-subjects-arg');
const ScannerUiType = require('./scanner-ui-type');

/**
 * Scans arguments as a an array of subject ids (memebers or roles) from a comma separated list of Discord mentions.
 * @alias DiscordSubjectsArgScanner
 * @extends DiscordMentionsArgScanner
 */
class DiscordSubjectsArgScanner extends DiscordMentionsArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.subjectsType;
  }

  /**
   * Returns the command class which can be used to get suggestions on input for this kind of argument.
   * @return {constructor} the command class
   */
  static getSuggestionsCommand() {
    return GetSubjectSuggestions;
  }

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}         context     Bot's context
   * @param  {LangManager}     langManager Lang manager of the command
   * @param  {Object}          message     Message's object (source-dependent)
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
        argValue = new DiscordSubjectsArg([OhUtils.ANY_VALUE], [OhUtils.ANY_VALUE]);
      } else {
        argValue = await this.parseDiscordSubjectArg(context, message, argText);
      }
    }

    return { value: argValue, nextPos: lastIndex };
  }

  /**
   * Parses the argument text into an array of ids for Discord subjects (members or roles).
   * Does not parse "any" value - it should be parsed separately.
   * @param  {Context}            context Bot's context
   * @param  {Object}             message Message's object (source-dependent)
   * @param  {string}             argText the text to be parsed
   * @return {DiscordSubjectsArg}         the array of subjects
   */
  static async parseDiscordSubjectArg(context, message, argText) {
    return new DiscordSubjectsArg(
      (await this.parseDiscordMentions(
        context,
        message,
        argText,
        DiscordUtils.DISCORD_SUBJECT_PREFIX + DiscordUtils.DISCORD_SUBJECT_ID_PREFIX,
        DiscordUtils.MENTION_TYPES.member
      )).concat(await this.parseDiscordMentions(context, message, argText,
        DiscordUtils.DISCORD_SUBJECT_PREFIX, DiscordUtils.MENTION_TYPES.member)),
      await this.parseDiscordMentions(context, message, argText,
        DiscordUtils.DISCORD_SUBJECT_PREFIX + DiscordUtils.DISCORD_SUBJECT_ROLE_PREFIX,
        DiscordUtils.MENTION_TYPES.role)
    );
  }
}

/**
 * Exports the DiscordSubjectsArgScanner class
 * @type {DiscordSubjectsArgScanner}
 */
module.exports = DiscordSubjectsArgScanner;

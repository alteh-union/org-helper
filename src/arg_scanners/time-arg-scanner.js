'use strict';

/**
 * @module time-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const SimpleArgScanner = require('./simple-arg-scanner');
const ScannerUiType = require('./scanner-ui-type');

const TimeArg = require('../command_meta/time-arg');

/**
 * Scans argument as a time definition (time distance or one-shot/recurrent schedule).
 * @see TimeArg
 * @alias TimeArgScanner
 * @extends SimpleArgScanner
 */
class TimeArgScanner extends SimpleArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.timeType;
  }

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}      context     Bot's context
   * @param  {LangManager}  langManager Lang manager of the command
   * @param  {Object}       message     Message's object (source-dependent)
   * @param  {string}       text        Text to be scanned to parse the argument
   * @return {Promise}                  Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text) {
    if (text === undefined || text === null || text === '') {
      return { value: null, nextPos: 1 };
    }

    const timeArg = new TimeArg(langManager);

    // Check if the text contains a valid type marker or at least a valid time definition.
    let nextSpace = OhUtils.findFirstNonQuotedIndex(text, ' ');
    if (nextSpace === -1) {
      nextSpace = text.length;
    }

    const firstDef = text.slice(0, Math.max(0, nextSpace));
    if (!timeArg.isValidTimeType(firstDef) && !timeArg.isValidTimeDef(firstDef)) {
      return { value: null, nextPos: 1 };
    }

    // If the first part of the text marks the type of the time arg, then set the type,
    // otherwise consider the type as "distance" and start to parse time definitions.
    if (timeArg.isValidTimeType(firstDef)) {
      timeArg.setTimeType(timeArg.parseTimeType(firstDef));
    } else {
      timeArg.setTimeType(TimeArg.DISTANCE_TYPE);
      timeArg.addDefinition(firstDef);
    }

    let nextPos = firstDef.length + 1;
    let nextText = text.slice(Math.max(0, nextPos));
    nextSpace = OhUtils.findFirstNonQuotedIndex(nextText, ' ');
    if (nextSpace === -1) {
      nextSpace = nextText.length;
    }

    let nextDef = nextText.slice(0, Math.max(0, nextSpace));

    // Scan and add definitions until the next part of text does not looks like a valid definition.
    // This can happen either when the text is not a definition at all, or when the next
    // definition cannot be added to the existing definitions. E.g. when a month is defined in the same arg
    // as dayofweek, or when the same definition type is defined twice.
    while (timeArg.isValidTimeDef(nextDef)) {
      timeArg.addDefinition(nextDef);

      nextPos = nextPos + nextDef.length + 1;
      nextText = nextText.slice(Math.max(0, nextSpace + 1));

      nextSpace = OhUtils.findFirstNonQuotedIndex(nextText, ' ');
      if (nextSpace === -1) {
        nextSpace = nextText.length;
      }

      nextDef = nextText.slice(0, Math.max(0, nextSpace));
    }

    // Adds the timezone definition based of org/user settings
    await this.appendTimezone(context, message, timeArg);
    // Auto complete definitions based on the type of the argument ("any" value for recurrent types etc.).
    timeArg.autoCompleteDefinitions();

    return { value: timeArg, nextPos };
  }

  /**
   * Appends a timezone definition to a TimeArg, based on organization's or individual preference for the timezone.
   * @see TimeArg
   * @param  {Context}      context     the Bot's context
   * @param  {BaseMessage}  message     the Discord message with the argument
   * @param  {TimeArg}      timeArg     the time argument to edit
   * @return {Promise}                  nothing
   */
  static async appendTimezone(context, message, timeArg) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    // Timezone should be checked depending on the message source (like Discord server etc.).
    // This class is too abstract to be dependent on the source.
    // Override the function in subclasses if needed.
  }
}

/**
 * Exports the TimeArgScanner class
 * @type {TimeArgScanner}
 */
module.exports = TimeArgScanner;

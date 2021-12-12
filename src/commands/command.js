'use strict';

/**
 * @module command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');

const SimpleArgScanner = require('../arg_scanners/simple-arg-scanner');

const ArgValidationTree = require('../command_meta/arg-validation-tree');
const OhUtils = require('../utils/bot-utils');

const DEFAULT_COMMAND_PREFIX = '!';
const ARG_PREFIX = ' -';

const ANY_VALUE_TEXT = 'permission_any_value';

/**
 * Generic command class.
 * @abstract
 * @alias Command
 */
class Command {
  /**
   * Constructs an instance of the class
   * @param {Context}     context            the Bot's context
   * @param {string}      source             the name of the source of the command (e.g. Discord)
   * @param {LangManager} commandLangManager the language manager to be used with particular command
   * @param {string}      orgId              the if of the organization within the source (e.g. a Discord guild)
   */
  constructor(context, source, commandLangManager, orgId) {
    this.context = context;
    this.source = source;
    this.langManager = commandLangManager;
    this.orgId = orgId;
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    throw new Error('DISPLAY_NAME: ' + this.name + ' is an abstract class');
  }

  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('createForOrg: ' + this.name + ' is an abstract class');
  }

  /**
   * Gets the default command prefix.
   * @type {string}
   */
  static get DEFAULT_COMMAND_PREFIX() {
    return DEFAULT_COMMAND_PREFIX;
  }

  /**
   * Gets the prefix to be considered as the start of an argument during scanning by name.
   * @type {string}
   */
  static get ARG_PREFIX() {
    return ARG_PREFIX;
  }

  /**
   * UI text id of the localizaed string representing "any" value.
   * @type {string}
   */
  static get ANY_VALUE_TEXT() {
    return ANY_VALUE_TEXT;
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    throw new Error('getCommandInterfaceName: ' + this.name + ' is an abstract class');
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return Object.freeze({});
  }

  /**
   * Gets the help text for the command (excluding the help text for particular arguments).
   * The lang manager is basically the manager from the HelpCommand's instance.
   * @see HelpCommand
   * @param  {Context}     context     the Bot's context
   * @param  {LangManager} langManager the language manager to localize the help text
   * @return {string}                  the localized help text
   */
  static getHelpText(context, langManager) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('getHelpText: ' + this.name + ' is an abstract class.');
  }

  /**
   * Gets the array of defined Bot's permission filters for the command.
   * Source-defined permissions (e.g. Discord permissions) should be defined in another place.
   * @return {Array<CommandPermissionFilter>} the array of Bot's permission filters
   */
  static getRequiredBotPermissions() {
    return [];
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {BaseMessage}  message the command's message
   * @return {Promise}              nothing
   */
  async validateArguments(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    await ArgValidationTree.validateCommandArguments(this);
  }

  /**
   * Extract text for a given argument from command's string during scanning by arg name.
   * In this case the start of the text is considered as the end of the predefined arg prefix + the arg name,
   * and the end of the arg text is either the next arg prefix found, or the end of the command string
   * if no next prefix is found.
   * @param  {string}         commandText    the text of the Discord command
   * @param  {CommandArgDef}  arg            the argument's definition
   * @return {string}                        the found argument's text
   */
  findArgValue(commandText, arg) {
    let prefixedArgName = this.constructor.ARG_PREFIX;
    let index = -1;
    for (let i = 0; i < arg.aliasIds.length; i++) {
      prefixedArgName = this.constructor.ARG_PREFIX + this.langManager.getString(arg.aliasIds[i]);
      index = OhUtils.findFirstNonQuotedIndex(commandText, prefixedArgName);
      if (index >= 0) {
        break;
      }
    }

    if (index === -1) {
      return null;
    }

    const textAfter = commandText.slice(Math.max(0, index + prefixedArgName.length));
    let endIndex = OhUtils.findFirstNonQuotedIndex(textAfter, this.constructor.ARG_PREFIX);
    if (endIndex === -1) {
      endIndex = commandText.length;
    } else {
      endIndex = index + prefixedArgName.length + endIndex;
    }

    const argText = commandText.slice(index + prefixedArgName.length + 1, endIndex).trim();
    return argText;
  }

  /**
   * Gets the default value for a given argument definition.
   * Used when unable to scan the argument from the command's text.
   * @param  {BaseMessage}    message the command's message
   * @param  {CommandArgDef}  arg     the argument definition
   * @return {Promise}                the default value
   */
  async getDefaultArgValue(message, arg) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    return null;
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [];
  }

  /**
   * Gets the array of defined Telegram permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Telegram-specific permissions required
   */
  static getRequiredTelegramPermissions() {
    return [];
  }

  /**
   * Sets arguments for the command by parsing them by their names from the command's text.
   * In this case the arguments in the text should be prepended by a predefined prefix with the arg's name.
   * The arg scanners will parse the parts of text between these prefixes with arg names.
   * If no value is found for an argument, then tries to get the default value for it as defined
   * by the command's class.
   * In any case, all defined arguments will have at least null value after executing this function.
   * @see Command#findArgValue
   * @see Command.getDefinedArgs
   * @param  {BaseMessage}  message     the Discord message with the command
   * @param  {Object}       commandArgs the pre-parsed arguments, can be null
   * @return {Promise}                  nothing
   */
  async parseArgumentsByNames(message, commandArgs) {
    const definedArgs = this.constructor.getDefinedArgs();
    const argsKeys = Object.keys(definedArgs);
    const thiz = this;

    const results = [];
    for (const argKey of argsKeys) {
      const argText = commandArgs ? commandArgs[argKey] : this.findArgValue(message.content, definedArgs[argKey]);
      results.push(
        definedArgs[argKey].scanner.scan(this.context, this.langManager, message, argText,
          SimpleArgScanner.SCAN_TYPES.byName)
          .then(async scanResult => {
            let argValue = scanResult.value;
            thiz.context.log.d(
              'argValue: ' + util.inspect(argValue, { showHidden: false, depth: 2 }) + '; for key: ' + argKey
            );
            if (argValue === null || argValue === undefined) {
              scanResult = await definedArgs[argKey].scanner.scan(
                thiz.context,
                thiz.langManager,
                message,
                await thiz.getDefaultArgValue(message, definedArgs[argKey]),
                SimpleArgScanner.SCAN_TYPES.byName
              );
              argValue = scanResult.value;
              thiz.context.log.d(
                'argValue after checking default: ' +
                util.inspect(argValue, { showHidden: false, depth: 2 }) +
                '; for key: ' +
                argKey
              );
            }

            thiz[argKey] = argValue;
          })
      );
    }

    await Promise.all(results);
  }

  /**
   * Sets arguments for the command by parsing them sequentially from the command's text,
   * in the order in which they are defined in the appropriate command's class.
   * In this case the borders between arguments in the text are determined by the scanner class which belong
   * to the argument being scanned at the moment. That is, the scanner will attemp to parse the argument from
   * the text and will tell where it stopped. The stop position will be passed to the scanner of the next argument
   * as the start position.
   * If skipInSequentialRead is set to true in the arg's definition, then it will be skipped during the scan.
   * in such case, and also if the scanners ran out of text, the command will try to set the default value for the arg.
   * In any case, all defined arguments will have at least null value after executing this function.
   * @see CommandArgDef
   * @see Command.getDefinedArgs
   * @param  {BaseMessage}  message the Discord message with the command
   * @return {Promise}              nothing
   */
  async parseArgumentsSequentially(message) {
    const definedArgs = this.constructor.getDefinedArgs();
    const argsKeys = Object.keys(definedArgs);

    const trimmedContent = OhUtils.dry(message.content);
    let remainingArgText = '';
    if (trimmedContent.indexOf(' ') > 0) {
      remainingArgText = trimmedContent.slice(Math.max(0, trimmedContent.indexOf(' ') + 1));
    }

    for (const argKey of argsKeys) {
      let argValue = null;
      if (definedArgs[argKey].skipInSequentialRead) {
        const defaultValue = await this.getDefaultArgValue(message, definedArgs[argKey]);
        // Must scan arguments one by one, since it's a sequential scan, and results depend on previous scanning.
        /* eslint-disable no-await-in-loop */
        const scanResult = await definedArgs[argKey].scanner.scan(
          this.context,
          this.langManager,
          message,
          defaultValue,
          SimpleArgScanner.SCAN_TYPES.byName
        );
        /* eslint-enable no-await-in-loop */
        argValue = scanResult.value;
        this.context.log.d(
          'argValue for an arg which is skipped in the sequence: ' +
            util.inspect(argValue, { showHidden: false, depth: 2 }) +
            '; for key: ' +
            argKey
        );
      } else {
        if (remainingArgText === '') {
          const defaultValue = await this.getDefaultArgValue(message, definedArgs[argKey]);
          // Must scan arguments one by one, since it's a sequential scan, and results depend on previous scanning.
          /* eslint-disable no-await-in-loop */
          const scanResult = await definedArgs[argKey].scanner.scan(
            this.context,
            this.langManager,
            message,
            defaultValue,
            SimpleArgScanner.SCAN_TYPES.byName
          );
          /* eslint-enable no-await-in-loop */
          argValue = scanResult.value;
          this.context.log.d(
            'argValue for an arg for which we ran out of command pieces: ' +
              util.inspect(argValue, { showHidden: false, depth: 2 }) +
              '; for key: ' +
              argKey
          );
        } else {
          // Must scan arguments one by one, since it's a sequential scan, and results depend on previous scanning.
          /* eslint-disable no-await-in-loop */
          const scanResult = await definedArgs[argKey].scanner.scan(
            this.context,
            this.langManager,
            message,
            remainingArgText,
            SimpleArgScanner.SCAN_TYPES.sequential
          );
          /* eslint-enable no-await-in-loop */
          argValue = scanResult.value;
          if (argValue === '') {
            argValue = null;
          }

          remainingArgText = remainingArgText.slice(Math.max(0, scanResult.nextPos)).trim();
        }

        this.context.log.d(
          'argValue from the command: ' +
            util.inspect(argValue, { showHidden: false, depth: 2 }) +
            '; for key: ' +
            argKey
        );
      }

      this[argKey] = argValue;
    }
  }

  /**
   * Determines how to parse the command's arguments and launches the appropriate scanning procedure.
   * If at lest one occurence of predefined arg prefix is found (non-quoted) then tries to parse
   * the argument by their names (like '!kill -name Bill -tool knife').
   * Otherwise tries to parse the arguments sequentially in the order in which they are defined
   * (e.g. '!kill Bill knife').
   * After finishing the scanning, launches the arguments validation.
   * @param  {BaseMessage}  message the Discord message with the command
   * @return {Promise}              nothing
   */
  async parseArguments(message) {
    const index = OhUtils.findFirstNonQuotedIndex(message.content, this.constructor.ARG_PREFIX);
    if (index === -1) {
      this.context.log.v('Sequential arg scan');
      await this.parseArgumentsSequentially(message);
    } else {
      this.context.log.v('Arg scan by name');
      await this.parseArgumentsByNames(message);
    }

    await this.validateArguments(message);
  }

  /**
   * Sets arguments for the command using the pre-parsed object received from frontend.
   * @see Command.getDefinedArgs
   * @param  {BaseMessage}  message     the Discord message with the command
   * @param  {Object}       commandArgs the pre-parsed arguments
   * @return {Promise}                  nothing
   */
  async parseWithReadyArgs(message, commandArgs) {
    this.context.log.v('Arg set from web');
    await this.parseArgumentsByNames(message, commandArgs);

    await this.validateArguments(message);
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('execute: ' + this.constructor.name + ' is an abstract class.');
  }
}

/**
 * Exports the Command class
 * @type {Command}
 */
module.exports = Command;

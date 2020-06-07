'use strict';

/**
 * @module discord-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');

const OhUtils = require('../utils/bot-utils');

const Command = require('../command_meta/command');
const ArgValidationTree = require('../command_meta/arg-validation-tree');

/**
 * Base Discord command.
 * @abstract
 * @alias DiscordCommand
 * @extends Command
 */
class DiscordCommand extends Command {
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
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [];
  }

  /**
   * Gets the default value for a given argument definition.
   * Used when unable to scan the argument from the command's text.
   * @param  {Context}        context the Bot's context
   * @param  {Message}        message the command's message
   * @param  {CommandArgDef}  arg     the argument definition
   * @return {Object}                 the default value
   */
  getDefaultDiscordArgValue(context, message, arg) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    return null;
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {Message}  discordMessage the command's message
   * @return {Promise}                 nothing
   */
  async validateFromDiscord(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    await ArgValidationTree.validateCommandArguments(this);
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {Message}         discordMessage the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForDiscord(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('executeForDiscord: ' + this.constructor.name + ' is an abstract class.');
  }

  /**
   * Extract text for a given argument from command's string during scanning by arg name.
   * In this case the start of the text is considered as the end of the predefined arg prefix + the arg name,
   * and the end of the arg text is either the next arg prefix found, or the end of the command string
   * if no next prefix is found.
   * @param  {string}         discordCommand the text of the Discord command
   * @param  {CommandArgDef}  arg            the argument's definition
   * @return {string}                        the found argument's text
   */
  findArgValue(discordCommand, arg) {
    let prefixedArgName = this.constructor.ARG_PREFIX;
    let index = -1;
    for (let i = 0; i < arg.aliasIds.length; i++) {
      prefixedArgName = this.constructor.ARG_PREFIX + this.langManager.getString(arg.aliasIds[i]);
      index = OhUtils.findFirstNonQuotedIndex(discordCommand, prefixedArgName);
      if (index >= 0) {
        break;
      }
    }

    if (index === -1) {
      return null;
    }

    const textAfter = discordCommand.slice(Math.max(0, index + prefixedArgName.length));
    let endIndex = OhUtils.findFirstNonQuotedIndex(textAfter, this.constructor.ARG_PREFIX);
    if (endIndex === -1) {
      endIndex = discordCommand.length;
    } else {
      endIndex = index + prefixedArgName.length + endIndex;
    }

    const argText = discordCommand.slice(index + prefixedArgName.length + 1, endIndex).trim();
    return argText;
  }

  /**
   * Sets arguments for the command by parsing them by their names from the command's text.
   * In this case the arguments in the text should be prepended by a predefined prefix with the arg's name.
   * The arg scanners will parse the parts of text between these prefixes with arg names.
   * If no value is found for an argument, then tries to get the default value for it as defined
   * by the command's class.
   * In any case, all defined arguments will have at least null value after executing this function.
   * @see DiscordCommand#findArgValue
   * @see Command.getDefinedArgs
   * @param  {Client}   client         the Discord client
   * @param  {Message}  discordMessage the Discord message with the command
   * @return {Promise}                 nothing
   */
  async parseFromDiscordByNames(client, discordMessage) {
    const definedArgs = this.constructor.getDefinedArgs();
    const argsKeys = Object.keys(definedArgs);
    const thiz = this;

    const results = [];
    for (const argKey of argsKeys) {
      const argText = this.findArgValue(discordMessage.content, definedArgs[argKey]);
      results.push(
        definedArgs[argKey].scanner
          .scan(this.context, this.langManager, discordMessage, argText)
          .then(async scanResult => {
            let argValue = scanResult.value;
            thiz.context.log.d(
              'argValue: ' + util.inspect(argValue, { showHidden: false, depth: 2 }) + '; for key: ' + argKey
            );
            if (argValue === null || argValue === undefined) {
              scanResult = await definedArgs[argKey].scanner.scan(
                thiz.context,
                thiz.langManager,
                discordMessage,
                thiz.getDefaultDiscordArgValue(discordMessage, definedArgs[argKey])
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
   * @param  {Client}   client         the Discord client
   * @param  {Message}  discordMessage the Discord message with the command
   * @return {Promise}                 nothing
   */
  async parseFromDiscordSequentially(client, discordMessage) {
    const definedArgs = this.constructor.getDefinedArgs();
    const argsKeys = Object.keys(definedArgs);

    const trimmedContent = OhUtils.dry(discordMessage.content);
    let remainingArgText = '';
    if (trimmedContent.indexOf(' ') > 0) {
      remainingArgText = trimmedContent.slice(Math.max(0, trimmedContent.indexOf(' ') + 1));
    }

    for (const argKey of argsKeys) {
      let argValue = null;
      if (definedArgs[argKey].skipInSequentialRead) {
        const defaultValue = this.getDefaultDiscordArgValue(discordMessage, definedArgs[argKey]);
        // Must scan arguments one by one, since it's a sequential scan, and results depend on previous scanning.
        /* eslint-disable no-await-in-loop */
        const scanResult = await definedArgs[argKey].scanner.scan(
          this.context,
          this.langManager,
          discordMessage,
          defaultValue
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
          const defaultValue = this.getDefaultDiscordArgValue(discordMessage, definedArgs[argKey]);
          // Must scan arguments one by one, since it's a sequential scan, and results depend on previous scanning.
          /* eslint-disable no-await-in-loop */
          const scanResult = await definedArgs[argKey].scanner.scan(
            this.context,
            this.langManager,
            discordMessage,
            defaultValue
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
            discordMessage,
            remainingArgText
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
   * @param  {Client}   client         the Discord client
   * @param  {Message}  discordMessage the Discord message with the command
   * @return {Promise}                 nothing
   */
  async parseFromDiscord(client, discordMessage) {
    const index = OhUtils.findFirstNonQuotedIndex(discordMessage.content, this.constructor.ARG_PREFIX);
    if (index === -1) {
      this.context.log.d('Sequential arg scan');
      await this.parseFromDiscordSequentially(client, discordMessage);
    } else {
      this.context.log.d('Arg scan by name');
      await this.parseFromDiscordByNames(client, discordMessage);
    }

    await this.validateFromDiscord(client, discordMessage);
  }
}

/**
 * Exports the DiscordCommand class
 * @type {DiscordCommand}
 */
module.exports = DiscordCommand;

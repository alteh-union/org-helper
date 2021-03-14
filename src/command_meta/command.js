'use strict';

/**
 * @module command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

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
}

/**
 * Exports the Command class
 * @type {Command}
 */
module.exports = Command;

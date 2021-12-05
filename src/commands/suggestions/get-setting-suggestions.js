'use strict';

/**
 * @module get-setting-suggestions
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Command = require('../command');
const ArgSuggestion = require('../../command_meta/arg-suggestion');
const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

/**
 * Command to get suggestions about possible settings in the Discord org.
 * @alias GetSettingSuggestions
 * @extends Command
 */
class GetSettingSuggestions extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new GetSettingSuggestions(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'get_setting_suggestions_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    throw new Error('DISPLAY_NAME: ' + this.name + ' is a suggestions command and should not have a display name.');
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
    throw new Error('getHelpText: ' + this.name + ' is a suggestions command and should not have a help text.');
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
    const availableSettings = Object.values(ServerSettingsTable.SERVER_SETTINGS);
    const localizedSettings = availableSettings.map(a => this.langManager.getString(a.textId));
    for (const setting of localizedSettings) {
      message.replyResult.suggestions.push(new ArgSuggestion(setting, ""));
    }
  }
}

/**
 * Exports the GetSettingSuggestions class
 * @type {GetSettingSuggestions}
 */
module.exports = GetSettingSuggestions;

'use strict';

/**
 * @module bad-words-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const ArrayArgScanner = require('../../arg_scanners/array-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

/**
 * Command to list the bad words currently set up for the Discord server.
 * @alias BadWordsCommand
 * @extends DiscordCommand
 */
class BadWordsCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new BadWordsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_badwords_name';
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
    return langManager.getString('command_badwords_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [PermissionsManager.DISCORD_PERMISSIONS.ADMINISTRATOR];
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForDiscord(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    const currentWordsString = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.badwords.name,
      ''
    );
    const currentWords = currentWordsString.split(ArrayArgScanner.ARRAY_SEPARATOR);

    if (currentWordsString.length > 0) {
      return this.langManager.getString('command_badwords_success', currentWords.join(', '));
    }

    return this.langManager.getString('command_badwords_empty');
  }
}

/**
 * Exports the BadWordsCommand class
 * @type {BadWordsCommand}
 */
module.exports = BadWordsCommand;

'use strict';

/**
 * @module set-ban-on-warnings-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const SimpleArgScanner = require('../../arg_scanners/simple-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const WarnCommand = require('../moderation/warn-command');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const SetBanOnWarningsCommandArgDefs = Object.freeze({
  count: new CommandArgDef('count', {
    aliasIds: ['command_setbanonwarnings_arg_count_alias_count', 'command_setbanonwarnings_arg_count_alias_c'],
    helpId: 'command_setbanonwarnings_arg_count_help',
    scanner: SimpleArgScanner,
    validationOptions: { isNonNegativeInteger: true }
  })
});

/**
 * Command to set how many warnings a user should receive before he gets banned by the Bot automatically.
 * Zero means the auto-ban is disabled.
 * @alias SetBanOnWarningsCommand
 * @extends DiscordCommand
 */
class SetBanOnWarningsCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new SetBanOnWarningsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_setbanonwarnings_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SetBanOnWarningsCommandArgDefs;
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
    return langManager.getString('command_setbanonwarnings_help',
      langManager.getString(WarnCommand.getCommandInterfaceName()));
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
   * Gets the default value for a given argument definition.
   * Used when unable to scan the argument from the command's text.
   * @param  {BaseMessage}    message the command's message
   * @param  {CommandArgDef}  arg     the argument definition
   * @return {Promise}                the default value
   */
  async getDefaultDiscordArgValue(message, arg) {
    switch (arg) {
      case SetBanOnWarningsCommandArgDefs.count:
        return '0';
      default:
        return null;
    }
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
    let textResult = null;
    const countNumber = Number.parseInt(this.count, 10);
    if (countNumber > 0) {
      textResult = 'command_setbanonwarnings_enabled';
    } else {
      textResult = 'command_setbanonwarnings_disabled';
    }

    await this.context.dbManager.setSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.banOnWarnings.name,
      this.count
    );

    return this.langManager.getString(textResult, this.count);
  }
}

/**
 * Exports the SetBanOnWarningsCommand class
 * @type {SetBanOnWarningsCommand}
 */
module.exports = SetBanOnWarningsCommand;

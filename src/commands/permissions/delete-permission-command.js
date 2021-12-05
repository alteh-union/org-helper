'use strict';

/**
 * @module delete-permission-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const ArrayArgScanner = require('../../arg_scanners/array-arg-scanner');

const PermissionsCommand = require('./permissions-command');
const GetPermissionSuggestions = require('../suggestions/get-permission-suggestions');

const PermissionsManager = require('../../managers/permissions-manager');

const DeletePermissionCommandArgDefs = Object.freeze({
  ids: new CommandArgDef('ids', {
    aliasIds: ['command_deletepermission_arg_ids_alias_ids', 'command_deletepermission_arg_ids_alias_i'],
    helpId: 'command_deletepermission_arg_ids_help',
    scanner: ArrayArgScanner,
    validationOptions: { isIdsArray: true },
    suggestions: GetPermissionSuggestions
  })
});

/**
 * Command to delete permissions according to their ids in the Discord server.
 * @alias DeleteReminderCommand
 * @extends Command
 */
class DeletePermissionCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new DeletePermissionCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_deletepermission_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_deletepermission_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return DeletePermissionCommandArgDefs;
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
    return langManager.getString(
      'command_deletepermission_help',
      langManager.getString(PermissionsCommand.getCommandInterfaceName())
    );
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
   * @param  {Message}         discordMessage the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    const orArray = [];
    for (let i = 0; i < this.ids.length; i++) {
      orArray.push({ id: Number.parseInt(this.ids[i], 10) });
    }

    const deleteQuery = { $or: orArray };
    await this.context.dbManager.deleteDiscordRows(this.context.dbManager.permissionsTable, this.orgId, deleteQuery);

    return this.langManager.getString('command_deletepermission_success');
  }
}

/**
 * Exports the DeletePermissionCommand class
 * @type {DeletePermissionCommand}
 */
module.exports = DeletePermissionCommand;

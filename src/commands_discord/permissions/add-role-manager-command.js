'use strict';

/**
 * @module add-role-manager-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const AddRoleManagerCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: [
      'command_addrolemanager_arg_subjectIds_alias_subjectIds',
      'command_addrolemanager_arg_subjectIds_alias_s'
    ],
    helpId: 'command_addrolemanager_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true }
  }),
  rolesIds: new CommandArgDef('rolesIds', {
    aliasIds: ['command_addrolemanager_arg_rolesIds_alias_rolesIds', 'command_addrolemanager_arg_rolesIds_alias_r'],
    helpId: 'command_addrolemanager_arg_rolesIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectRolesOnly: true }
  })
});

/**
 * Command to set users or roles as role-managers for specified roles (adds permissions).
 * @alias AddRoleManagerCommand
 * @extends DiscordCommand
 */
class AddRoleManagerCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new AddRoleManagerCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_addrolemanager_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return AddRoleManagerCommandArgDefs;
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
    return langManager.getString('command_addrolemanager_help');
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
   * @param  {Message}         discordMessage the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForDiscord(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    let result = '';
    const dbResults = [];
    for (let i = 0; i < this.rolesIds.subjectRoles.length; i++) {
      const filter = { roleId: this.rolesIds.subjectRoles[i] };

      const subjectTypes = [];
      const subjectIds = [];
      for (let j = 0; j < this.subjectIds.subjectIds.length; j++) {
        subjectTypes.push(PermissionsManager.SUBJECT_TYPES.user.name);
        subjectIds.push(this.subjectIds.subjectIds[i]);
      }

      for (let j = 0; j < this.subjectIds.subjectRoles.length; j++) {
        subjectTypes.push(PermissionsManager.SUBJECT_TYPES.role.name);
        subjectIds.push(this.subjectIds.subjectRoles[i]);
      }

      for (const [j, element] of subjectIds.entries()) {
        const permissionRow = {
          source: this.source,
          orgId: this.orgId,
          subjectType: subjectTypes[j],
          subjectId: element,
          permissionType: PermissionsManager.DEFINED_PERMISSIONS.role.name,
          filter
        };

        dbResults.push(
          this.context.dbManager.insertDiscordNext(this.context.dbManager.permissionsTable, this.orgId, permissionRow)
        );
      }
    }

    const rowResults = await Promise.all(dbResults);

    for (const rowResult of rowResults) {
      if (rowResult) {
        result = result + this.langManager.getString('command_addrolemanager_success') + '\n';
      } else {
        result = result + this.langManager.getString('command_addrolemanager_duplicate') + '\n';
      }
    }

    return result;
  }
}

/**
 * Exports the AddRoleManagerCommand class
 * @type {AddRoleManagerCommand}
 */
module.exports = AddRoleManagerCommand;

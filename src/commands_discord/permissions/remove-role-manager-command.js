'use strict';

/**
 * @module remove-role-manager-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const OhUtils = require('../../utils/bot-utils');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const RemoveRoleManagerCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: [
      'command_removerolemanager_arg_subjectIds_alias_subjectIds',
      'command_removerolemanager_arg_subjectIds_alias_s'
    ],
    helpId: 'command_removerolemanager_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, anyValueAllowed: true }
  }),
  rolesIds: new CommandArgDef('rolesIds', {
    aliasIds: [
      'command_removerolemanager_arg_rolesIds_alias_rolesIds',
      'command_removerolemanager_arg_rolesIds_alias_r'
    ],
    helpId: 'command_removerolemanager_arg_rolesIds_alias_r',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, anyValueAllowed: true, subjectRolesOnly: true }
  })
});

/**
 * Command to remove permission for specified users or roles to manage specified roles (removes permissions).
 * @alias RemoveRoleManagerCommand
 * @extends DiscordCommand
 */
class RemoveRoleManagerCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {string}      orgId              the organization identifier
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, orgId, commandLangManager) {
    return new RemoveRoleManagerCommand(context, source, orgId, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_removerolemanager_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return RemoveRoleManagerCommandArgDefs;
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
    return langManager.getString('command_removerolemanager_help');
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
   * @param  {Message}        message the command's message
   * @param  {CommandArgDef}  arg     the argument definition
   * @return {Object}                 the default value
   */
  getDefaultDiscordArgValue(message, arg) {
    switch (arg) {
      case RemoveRoleManagerCommandArgDefs.rolesIds:
        return this.langManager.getString(DiscordCommand.ANY_VALUE_TEXT);
      case RemoveRoleManagerCommandArgDefs.subjectIds:
        return this.langManager.getString(DiscordCommand.ANY_VALUE_TEXT);
      default:
        return null;
    }
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
    let count = 0;
    const typeFilter = { permissionType: PermissionsManager.DEFINED_PERMISSIONS.role.name };
    const permissions = await this.context.dbManager.getDiscordRows(
      this.context.dbManager.permissionsTable,
      this.orgId,
      typeFilter
    );

    const results = [];
    for (const permission of permissions) {
      let subjectMatch = false;
      if (this.subjectIds.subjectIds.includes(OhUtils.ANY_VALUE)) {
        subjectMatch = true;
      } else if (permission.subjectType === PermissionsManager.SUBJECT_TYPES.user.name) {
        subjectMatch = this.subjectIds.subjectIds.includes(permission.subjectId);
      } else {
        subjectMatch = this.subjectIds.subjectRoles.includes(permission.subjectId);
      }

      if (!subjectMatch) {
        continue;
      }

      let roleMatch = false;
      if (this.rolesIds.subjectRoles.includes(OhUtils.ANY_VALUE)) {
        roleMatch = true;
      } else if (
        this.rolesIds.subjectRoles.includes(permission.filter[PermissionsManager.DEFINED_FILTERS.roleId.name])
      ) {
        roleMatch = true;
      }

      if (!roleMatch) {
        continue;
      }

      const deleteQuery = { id: permission.id };
      results.push(
        this.context.dbManager.deleteDiscordRows(this.context.dbManager.permissionsTable, this.orgId, deleteQuery)
      );
      count++;
    }

    await Promise.all(results);

    let result = '';
    if (count > 0) {
      result = this.langManager.getString('command_removerolemanager_success', count);
    } else {
      result = this.langManager.getString('command_removerolemanager_no_matches');
    }

    return result;
  }
}

/**
 * Exports the RemoveRoleManagerCommand class
 * @type {RemoveRoleManagerCommand}
 */
module.exports = RemoveRoleManagerCommand;

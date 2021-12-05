'use strict';

/**
 * @module remove-role-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const CommandPermissionFilter = require('../../command_meta/command-permission-filter');
const CommandPermissionFilterField = require('../../command_meta/command-permission-filter-field');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const AddRoleCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_removerole_arg_subjectIds_alias_subjectIds', 'command_removerole_arg_subjectIds_alias_s'],
    helpId: 'command_removerole_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectIdsOnly: true }
  }),
  roleIds: new CommandArgDef('roleIds', {
    aliasIds: ['command_removerole_arg_roleIds_alias_roleIds', 'command_removerole_arg_roleIds_alias_r'],
    helpId: 'command_removerole_arg_roleIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectRolesOnly: true }
  })
});

/**
 * Command to remove specified role from Discord users.
 * @alias RemoveRoleCommand
 * @extends Command
 */
class RemoveRoleCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new RemoveRoleCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_removerole_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_removerole_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return AddRoleCommandArgDefs;
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
    return langManager.getString('command_removerole_help');
  }

  /**
   * Gets the array of defined Bot's permission filters for the command.
   * Source-defined permissions (e.g. Discord permissions) should be defined in another place.
   * @return {Array<CommandPermissionFilter>} the array of Bot's permission filters
   */
  static getRequiredBotPermissions() {
    return [
      new CommandPermissionFilter(PermissionsManager.DEFINED_PERMISSIONS.role.name, [
        new CommandPermissionFilterField(
          PermissionsManager.DEFINED_FILTERS.roleId.name,
          AddRoleCommandArgDefs.roleIds.name
        )
      ])
    ];
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
    let removedCount = 0;
    let totalCount = 0;
    let errorCount = 0;
    let errorPermissionsCount = 0;

    const members = await message.source.client.guilds.cache.get(this.orgId).members.fetch();
    const membersArray = Array.from(members.values());
    const roles = await message.source.client.guilds.cache.get(this.orgId).roles.fetch();
    const rolesArray = Array.from(roles.cache.values());
    const resultArray = [];

    for (const role of rolesArray) {
      if (!this.roleIds.subjectRoles.includes(role.id)) {
        continue;
      }

      for (const member of membersArray) {
        if (!this.subjectIds.subjectIds.includes(member.id)) {
          continue;
        }

        totalCount++;
        if (member.roles.cache.has(role.id)) {
          resultArray.push(
            members
              .get(member.id)
              .roles.remove(roles.cache.get(role.id))
              .then(
                success => {
                  removedCount++;
                },
                error => {
                  this.context.log.e(
                    'RemoveRoleCommand execute e: ' + util.inspect(error, { showHidden: true, depth: 8 })
                  );
                  errorCount++;
                  if (error.code === 50013) {
                    errorPermissionsCount++;
                  }
                }
              )
          );
        }
      }
    }

    await Promise.all(resultArray);

    return (
      this.langManager.getString('command_removerole_success', removedCount, totalCount, errorCount) +
      (errorPermissionsCount > 0
        ? ' ' + this.langManager.getString('command_removerole_missing_permissions', errorPermissionsCount)
        : '')
    );
  }
}

/**
 * Exports the RemoveRoleCommand class
 * @type {RemoveRoleCommand}
 */
module.exports = RemoveRoleCommand;

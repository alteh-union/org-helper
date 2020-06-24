'use strict';

/**
 * @module add-role-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const CommandPermissionFilter = require('../../command_meta/command-permission-filter');
const CommandPermissionFilterField = require('../../command_meta/command-permission-filter-field');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const AddRoleCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_addrole_arg_subjectIds_alias_subjectIds', 'command_addrole_arg_subjectIds_alias_s'],
    helpId: 'command_addrole_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectIdsOnly: true }
  }),
  roleIds: new CommandArgDef('roleIds', {
    aliasIds: ['command_addrole_arg_roleIds_alias_roleIds', 'command_addrole_arg_roleIds_alias_r'],
    helpId: 'command_addrole_arg_roleIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectRolesOnly: true }
  })
});

/**
 * Command for adding Discord roles to users.
 * @alias AddRoleCommand
 * @extends DiscordCommand
 */
class AddRoleCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new AddRoleCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_addrole_name';
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
    return langManager.getString('command_addrole_help');
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
   * @param  {BaseMessage}         message the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForDiscord(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    let addedCount = 0;
    let totalCount = 0;
    let errorCount = 0;
    let errorPermissionsCount = 0;

    const context = this.context;
    const members = await this.context.discordClient.guilds.cache.get(this.orgId).members.fetch();
    const membersArray = Array.from(members.values());
    const roles = await this.context.discordClient.guilds.cache.get(this.orgId).roles.fetch();
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
        if (!member.roles.cache.has(role.id)) {
          resultArray.push(
            members
              .get(member.id)
              .roles.add(roles.cache.get(role.id))
              .then(
                success => {
                  addedCount++;
                },
                error => {
                  context.log.e(
                    'AddRoleCommand executeForDiscord e: ' + util.inspect(error, { showHidden: true, depth: 8 })
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
      this.langManager.getString('command_addrole_success', addedCount, totalCount, errorCount) +
      (errorPermissionsCount > 0
        ? ' ' + this.langManager.getString('command_addrole_missing_permissions', errorPermissionsCount)
        : '')
    );
  }
}

/**
 * Exports the AddRoleCommand class
 * @type {AddRoleCommand}
 */
module.exports = AddRoleCommand;

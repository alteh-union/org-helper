'use strict';

/**
 * @module deny-image-template-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');

const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const DenyImageTemplateCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_denyimagetemplate_arg_subjectIds_alias_subjectIds',
      'command_denyimagetemplate_arg_subjectIds_alias_s'],
    helpId: 'command_denyimagetemplate_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true }
  })
});

/**
 * Command to remove permissions from users or roles to manage image templates.
 * @alias DenyImageTemplateCommand
 * @extends Command
 */
class DenyImageTemplateCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new DenyImageTemplateCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_denyimagetemplate_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_denyimagetemplate_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return DenyImageTemplateCommandArgDefs;
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
    return langManager.getString('command_denyimagetemplate_help');
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
   * @param  {BaseMessage}         message the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    let count = 0;
    const typeFilter = { permissionType: PermissionsManager.DEFINED_PERMISSIONS.imagetemplate.name };
    const permissions = await this.context.dbManager.getDiscordRows(
      this.context.dbManager.permissionsTable,
      this.orgId,
      typeFilter
    );

    const results = [];
    for (const permission of permissions) {
      let subjectMatch = false;
      if (permission.subjectType === PermissionsManager.SUBJECT_TYPES.user.name) {
        subjectMatch = this.subjectIds.subjectIds.includes(permission.subjectId);
      } else {
        subjectMatch = this.subjectIds.subjectRoles.includes(permission.subjectId);
      }

      if (!subjectMatch) {
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
      result = this.langManager.getString('command_denyimagetemplate_success', count);
    } else {
      result = this.langManager.getString('command_denyimagetemplate_no_matches');
    }

    return result;
  }
}

/**
 * Exports the DenyImageTemplateCommand class
 * @type {DenyImageTemplateCommand}
 */
module.exports = DenyImageTemplateCommand;

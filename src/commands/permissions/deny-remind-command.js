'use strict';

/**
 * @module deny-remind-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordChannelsArgScanner = require('../../arg_scanners/discord-channels-arg-scanner');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const DenyRemindCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_denyremind_arg_subjectIds_alias_subjectIds', 'command_denyremind_arg_subjectIds_alias_s'],
    helpId: 'command_denyremind_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true }
  }),
  channelIds: new CommandArgDef('channelIds', {
    aliasIds: ['command_denyremind_arg_channelIds_alias_channelIds', 'command_denyremind_arg_channelIds_alias_c'],
    helpId: 'command_denyremind_arg_channelIds_help',
    scanner: DiscordChannelsArgScanner,
    validationOptions: { validTextChannels: true, anyValueAllowed: true }
  })
});

/**
 * Command to remove permissions from users or roles to remind text channels.
 * @alias DenyRemindCommand
 * @extends Command
 */
class DenyRemindCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new DenyRemindCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_denyremind_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_denyremind_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return DenyRemindCommandArgDefs;
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
    return langManager.getString('command_denyremind_help');
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
  async getDefaultArgValue(message, arg) {
    switch (arg) {
      case DenyRemindCommandArgDefs.channelIds:
        return this.langManager.getString(Command.ANY_VALUE_TEXT);
      default:
        return null;
    }
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
    const typeFilter = { permissionType: PermissionsManager.DEFINED_PERMISSIONS.remind.name };
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

      let channelMatch = false;
      if (this.channelIds.channels.includes(OhUtils.ANY_VALUE)) {
        channelMatch = true;
      } else if (
        this.channelIds.channels.includes(permission.filter[PermissionsManager.DEFINED_FILTERS.channelId.name])
      ) {
        channelMatch = true;
      }

      if (!channelMatch) {
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
      result = this.langManager.getString('command_denyremind_success', count);
    } else {
      result = this.langManager.getString('command_denyremind_no_matches');
    }

    return result;
  }
}

/**
 * Exports the DenyRemindCommand class
 * @type {DenyRemindCommand}
 */
module.exports = DenyRemindCommand;

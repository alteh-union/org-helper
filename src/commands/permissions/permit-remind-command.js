'use strict';

/**
 * @module permit-remind-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');

const DiscordChannelsArgScanner = require('../../arg_scanners/discord-channels-arg-scanner');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const PermitRemindCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_permitremind_arg_subjectIds_alias_subjectIds', 'command_permitremind_arg_subjectIds_alias_s'],
    helpId: 'command_permitremind_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true }
  }),
  channelIds: new CommandArgDef('channelIds', {
    aliasIds: ['command_permitremind_arg_channelIds_alias_channelIds', 'command_permitremind_arg_channelIds_alias_c'],
    helpId: 'command_permitremind_arg_channelIds_help',
    scanner: DiscordChannelsArgScanner,
    validationOptions: { validTextChannels: true, anyValueAllowed: true }
  })
});

/**
 * Command to add permission for specified users or roles to remind Dicord text channels.
 * @alias PermitRemindCommand
 * @extends Command
 */
class PermitRemindCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new PermitRemindCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_permitremind_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_permitremind_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return PermitRemindCommandArgDefs;
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
    return langManager.getString('command_permitremind_help');
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
      case PermitRemindCommandArgDefs.channelIds:
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
    const currentRows = await this.context.dbManager.getDiscordRows(
      this.context.dbManager.permissionsTable,
      this.orgId
    );
    const maxIndex = OhUtils.findMaxId(currentRows);

    let newId = maxIndex + 1;

    let result = '';
    const dbResults = [];
    for (let i = 0; i < this.channelIds.channels.length; i++) {
      const filter = { channelId: this.channelIds.channels[i] };

      const subjectTypes = [];
      const subjects = [];
      for (let j = 0; j < this.subjectIds.subjectIds.length; j++) {
        subjectTypes.push(PermissionsManager.SUBJECT_TYPES.user.name);
        subjects.push(this.subjectIds.subjectIds[j]);
      }

      for (let j = 0; j < this.subjectIds.subjectRoles.length; j++) {
        subjectTypes.push(PermissionsManager.SUBJECT_TYPES.role.name);
        subjects.push(this.subjectIds.subjectRoles[j]);
      }

      for (const [j, element] of subjects.entries()) {
        const permissionRow = {
          id: newId++,
          source: this.source,
          orgId: this.orgId,
          subjectType: subjectTypes[j],
          subjectId: element,
          permissionType: PermissionsManager.DEFINED_PERMISSIONS.remind.name,
          filter
        };

        dbResults.push(this.context.dbManager.insertOne(this.context.dbManager.permissionsTable, permissionRow));
      }
    }

    const rowResults = await Promise.all(dbResults);

    for (const rowResult of rowResults) {
      if (rowResult) {
        result = result + this.langManager.getString('command_permitremind_success') + '\n';
      } else {
        result = result + this.langManager.getString('command_permitremind_duplicate') + '\n';
      }
    }

    return result;
  }
}

/**
 * Exports the PermitRemindCommand class
 * @type {PermitRemindCommand}
 */
module.exports = PermitRemindCommand;

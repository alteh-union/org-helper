'use strict';

/**
 * @module warnings-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');
const DiscordUtils = require('../../utils/discord-utils');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const WarningsCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_warnings_arg_subjectIds_alias_subjectIds', 'command_warnings_arg_subjectIds_alias_s'],
    helpId: 'command_warnings_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectIdsOnly: true, anyValueAllowed: true }
  })
});

/**
 * Lists warnings given by moderators to all users or specified user(s).
 * @alias WarningsCommand
 * @extends DiscordCommand
 */
class WarningsCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new WarningsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_warnings_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return WarningsCommandArgDefs;
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
    return langManager.getString('command_warnings_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [PermissionsManager.DISCORD_PERMISSIONS.BAN_MEMBERS];
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
      case WarningsCommandArgDefs.subjectIds:
        return this.langManager.getString(DiscordCommand.ANY_VALUE_TEXT);
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
    let usersFilter = {};
    const orArray = [];
    if (this.subjectIds.subjectIds.length > 1 || this.subjectIds.subjectIds[0] !== OhUtils.ANY_VALUE) {
      for (let i = 0; i < this.subjectIds.subjectIds.length; i++) {
        orArray.push({ userId: this.subjectIds.subjectIds[i] });
      }

      usersFilter = { $or: orArray };
    }

    const warnings = await this.context.dbManager.getDiscordRows(this.context.dbManager.warningsTable, this.orgId,
      usersFilter);

    if (warnings.length === 0) {
      return this.langManager.getString('command_warnings_no_warnings');
    }

    let result = '';
    for (const warning of warnings) {
      result += this.langManager.getString(
        'command_warnings_warning',
        warning.id,
        DiscordUtils.makeUserMention(warning.userId),
        DiscordUtils.makeUserMention(warning.moderatorId),
        new Date(warning.timestamp).toISOString(),
        warning.reason
      );
    }

    return result;
  }
}

/**
 * Exports the WarningsCommand class
 * @type {WarningsCommand}
 */
module.exports = WarningsCommand;

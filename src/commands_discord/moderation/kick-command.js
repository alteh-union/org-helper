'use strict';

/**
 * @module kick-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordUtils = require('../../utils/discord-utils');

const BaseModerationCommand = require('./base-moderation-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');
const FullStringArgScanner = require('../../arg_scanners/full-string-arg-scanner');

const SetModerLogsCommand = require('../settings/set-moder-logs-command');

const PermissionsManager = require('../../managers/permissions-manager');

const KickCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_kick_arg_subjectIds_alias_subjectIds', 'command_kick_arg_subjectIds_alias_s'],
    helpId: 'command_kick_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectIdsOnly: true }
  }),
  reason: new CommandArgDef('reason', {
    aliasIds: ['command_kick_arg_reason_alias_reason', 'command_kick_arg_reason_alias_r'],
    helpId: 'command_kick_arg_reason_help',
    scanner: FullStringArgScanner
  })
});

/**
 * Kicks a user(s) from the server and optionally records the reason to the moderation logs.
 * @alias KickCommand
 * @extends BaseModerationCommand
 */
class KickCommand extends BaseModerationCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new KickCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_kick_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_kick_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return KickCommandArgDefs;
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
    return langManager.getString('command_kick_help',
      langManager.getString(SetModerLogsCommand.getCommandInterfaceName()));
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [PermissionsManager.DISCORD_PERMISSIONS.KICK_MEMBERS];
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the Discord message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async executeForDiscord(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    let kickedCount = 0;
    let totalCount = 0;
    let errorCount = 0;

    const membersManager = await message.source.client.guilds.cache.get(this.orgId).members;

    for (const subjectId of this.subjectIds.subjectIds) {
      totalCount++;
      const member = await membersManager.fetch(subjectId);

      if (member === undefined) {
        errorCount++;
        this.context.log.e("Tried to kick an already deleted user " + subjectId + " from guild " + this.orgId);
        continue;
      }

      try {
        await member.kick(this.reason);
        kickedCount++;

        this.logModerAction(this.langManager.getString('command_kick_log',
          DiscordUtils.makeUserMention(member.id), DiscordUtils.makeUserMention(message.originalMessage.member.id),
          this.reason));
      } catch (e) {
        this.context.log.e("Got exception while trying to kick user " + subjectId + " from guild " + this.orgId +
          ' stack: ' + e.stack);
        errorCount++;
      }
    }

    return (
      this.langManager.getString('command_kick_success', kickedCount, totalCount, errorCount)
    );
  }
}

/**
 * Exports the KickCommand class
 * @type {KickCommand}
 */
module.exports = KickCommand;

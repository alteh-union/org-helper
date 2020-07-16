'use strict';

/**
 * @module ban-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordUtils = require('../../utils/discord-utils');

const BaseModerationCommand = require('./base-moderation-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');
const FullStringArgScanner = require('../../arg_scanners/full-string-arg-scanner');
const SimpleArgScanner = require('../../arg_scanners/simple-arg-scanner');

const SetModerLogsCommand = require('../settings/set-moder-logs-command');

const PermissionsManager = require('../../managers/permissions-manager');

const BanCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_ban_arg_subjectIds_alias_subjectIds', 'command_ban_arg_subjectIds_alias_s'],
    helpId: 'command_ban_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectIdsOnly: true }
  }),
  daysToClean: new CommandArgDef('daysToClean', {
    aliasIds: ['command_ban_arg_daysToClean_alias_daysToClean', 'command_ban_arg_daysToClean_alias_d'],
    helpId: 'command_ban_arg_daysToClean_help',
    scanner: SimpleArgScanner,
    skipInSequentialRead: true,
    validationOptions: { isNonNegativeInteger: true }
  }),
  reason: new CommandArgDef('reason', {
    aliasIds: ['command_ban_arg_reason_alias_reason', 'command_ban_arg_reason_alias_r'],
    helpId: 'command_ban_arg_reason_help',
    scanner: FullStringArgScanner
  })
});

/**
 * Bans a user(s) from the server and optionally records the reason to the moderation logs.
 * @alias BanCommand
 * @extends BaseModerationCommand
 */
class BanCommand extends BaseModerationCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new BanCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_ban_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return BanCommandArgDefs;
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
    return langManager.getString('command_ban_help',
      langManager.getString(SetModerLogsCommand.getCommandInterfaceName()),
      langManager.getString(BanCommandArgDefs.daysToClean.aliasIds[0]));
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
   * @return {Object}                 the default value
   */
  getDefaultDiscordArgValue(message, arg) {
    switch (arg) {
      case BanCommandArgDefs.daysToClean:
        return '0';
      default:
        return null;
    }
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
    let bannedCount = 0;
    let totalCount = 0;
    let errorCount = 0;

    this.daysToClean = Number.parseInt(this.daysToClean, 10);

    const membersManager = await message.source.client.guilds.cache.get(this.orgId).members;

    for (const subjectId of this.subjectIds.subjectIds) {
      totalCount++;
      const member = await membersManager.fetch(subjectId);

      if (member === undefined) {
        errorCount++;
        this.context.log.e("Tried to ban an already deleted user " + subjectId + " from guild " + this.orgId);
        continue;
      }

      try {
        await member.ban({ days: this.daysToClean, reason: this.reason });
        bannedCount++;

        this.logModerAction(this.langManager.getString('command_ban_log',
          DiscordUtils.makeUserMention(member.id), DiscordUtils.makeUserMention(message.originalMessage.member.id),
          this.reason));
      } catch (e) {
        this.context.log.e("Got exception while trying to ban user " + subjectId + " from guild " + this.orgId +
          ' stack: ' + e.stack);
        errorCount++;
      }
    }

    return (
      this.langManager.getString('command_ban_success', bannedCount, totalCount, errorCount)
    );
  }
}

/**
 * Exports the BanCommand class
 * @type {BanCommand}
 */
module.exports = BanCommand;

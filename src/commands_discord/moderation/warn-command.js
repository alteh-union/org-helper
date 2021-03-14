'use strict';

/**
 * @module warn-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');

const DiscordUtils = require('../../utils/discord-utils');

const BaseModerationCommand = require('./base-moderation-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const DiscordSubjectsArgScanner = require('../../arg_scanners/discord-subjects-arg-scanner');
const FullStringArgScanner = require('../../arg_scanners/full-string-arg-scanner');

const SetModerLogsCommand = require('../settings/set-moder-logs-command');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const WarnCommandArgDefs = Object.freeze({
  subjectIds: new CommandArgDef('subjectIds', {
    aliasIds: ['command_warn_arg_subjectIds_alias_subjectIds', 'command_warn_arg_subjectIds_alias_s'],
    helpId: 'command_warn_arg_subjectIds_help',
    scanner: DiscordSubjectsArgScanner,
    validationOptions: { validSubjects: true, subjectsNonEmpty: true, subjectIdsOnly: true }
  }),
  reason: new CommandArgDef('reason', {
    aliasIds: ['command_warn_arg_reason_alias_reason', 'command_warn_arg_reason_alias_r'],
    helpId: 'command_warn_arg_reason_help',
    scanner: FullStringArgScanner
  })
});

/**
 * Warns a user(s) and optionally records the reason to the moderation logs.
 * If ban on warnings is enabled in the server and the user has got enough warnings, he gets
 * banned (without cleaning his messages).
 * @alias WarnCommand
 * @extends BaseModerationCommand
 */
class WarnCommand extends BaseModerationCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new WarnCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_warn_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_warn_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return WarnCommandArgDefs;
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
    return langManager.getString('command_warn_help',
      langManager.getString(SetModerLogsCommand.getCommandInterfaceName()));
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
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the Discord message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async executeForDiscord(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    let warnedCount = 0;
    let totalCount = 0;
    let errorCount = 0;

    const warningsLimitString = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.banOnWarnings.name,
      '0'
    );
    const warningsLimit = Number.parseInt(warningsLimitString, 10);

    const membersManager = await message.source.client.guilds.cache.get(this.orgId).members;

    const currentRows = await this.context.dbManager.getDiscordRows(this.context.dbManager.warningsTable, this.orgId);
    let maxIndex = OhUtils.findMaxId(currentRows);

    for (const subjectId of this.subjectIds.subjectIds) {
      totalCount++;
      const member = await membersManager.fetch(subjectId);

      if (member === undefined) {
        errorCount++;
        this.context.log.e("Tried to warn an already deleted user " + subjectId + " from guild " + this.orgId);
        continue;
      }

      try {
        const currentUserWarnings = await this.context.dbManager.getDiscordRows(this.context.dbManager.warningsTable,
          this.orgId, { userId: subjectId });

        const warningRow = {
          id: ++maxIndex,
          source: this.source,
          orgId: this.orgId,
          userId: subjectId,
          moderatorId: message.originalMessage.member.id,
          reason: this.reason,
          timestamp: new Date().getTime()
        };

        const rowResult = await this.context.dbManager.insertOne(this.context.dbManager.warningsTable, warningRow);

        if (rowResult) {
          warnedCount++;
        } else {
          errorCount++;
          continue;
        }

        this.logModerAction(this.langManager.getString('command_warn_log',
          DiscordUtils.makeUserMention(member.id), DiscordUtils.makeUserMention(message.originalMessage.member.id),
          this.reason));

        // If auto-ban on warnings is enabled and the user got enough warnings, then ban him.
        if (warningsLimit > 0 && currentUserWarnings.length >= warningsLimit - 1) {
          await member.ban({ days: 0, reason: this.langManager.getString('command_warn_banreason') });

          this.logModerAction(this.langManager.getString('command_ban_log',
            DiscordUtils.makeUserMention(member.id), DiscordUtils.makeUserMention(message.originalMessage.member.id),
            this.langManager.getString('command_warn_banreason')));
        }
      } catch (e) {
        this.context.log.e("Got exception while trying to warn user " + subjectId + " from guild " + this.orgId +
          ' stack: ' + e.stack);
        errorCount++;
      }
    }

    return (
      this.langManager.getString('command_warn_success', warnedCount, totalCount, errorCount)
    );
  }
}

/**
 * Exports the WarnCommand class
 * @type {WarnCommand}
 */
module.exports = WarnCommand;

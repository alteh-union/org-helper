'use strict';

/**
 * @module reminders-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');
const DiscordUtils = require('../../utils/discord-utils');

const DiscordCommand = require('../discord-command');
const TimeArg = require('../../command_meta/time-arg');
const CommandArgDef = require('../../command_meta/command-arg-def');
const CommandPermissionFilter = require('../../command_meta/command-permission-filter');
const CommandPermissionFilterField = require('../../command_meta/command-permission-filter-field');
const DiscordChannelsArgScanner = require('../../arg_scanners/discord-channels-arg-scanner');

const OrgTask = require('../../mongo_classes/org-task');

const PermissionsManager = require('../../managers/permissions-manager');

const RemindersCommandArgDefs = Object.freeze({
  channelIds: new CommandArgDef('channelIds', {
    aliasIds: ['command_reminders_arg_channelIds_alias_channelIds', 'command_reminders_arg_channelIds_alias_c'],
    helpId: 'command_reminders_arg_channelIds_help',
    scanner: DiscordChannelsArgScanner,
    validationOptions: { validTextChannels: true, anyValueAllowed: true }
  })
});

/**
 * Command to list the reminders set up in the Discord server.
 * @alias RemindersCommand
 * @extends DiscordCommand
 */
class RemindersCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {string}      orgId              the organization identifier
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, orgId, commandLangManager) {
    return new RemindersCommand(context, source, orgId, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_reminders_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return RemindersCommandArgDefs;
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
    return langManager.getString('command_reminders_help');
  }

  /**
   * Gets the array of defined Bot's permission filters for the command.
   * Source-defined permissions (e.g. Discord permissions) should be defined in another place.
   * @return {Array<CommandPermissionFilter>} the array of Bot's permission filters
   */
  static getRequiredBotPermissions() {
    return [
      new CommandPermissionFilter(PermissionsManager.DEFINED_PERMISSIONS.remind.name, [
        new CommandPermissionFilterField(
          PermissionsManager.DEFINED_FILTERS.channelId.name,
          RemindersCommandArgDefs.channelIds.name
        )
      ])
    ];
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
      case RemindersCommandArgDefs.channelIds:
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
    let channelsFilter = {};
    const orArray = [];
    if (this.channelIds.channels.length > 1 || this.channelIds.channels[0] !== OhUtils.ANY_VALUE) {
      for (let i = 0; i < this.channelIds.channels.length; i++) {
        orArray.push({ 'content.channel': this.channelIds.channels[i] });
      }

      channelsFilter = { $or: orArray };
    }

    const andArray = [channelsFilter, { type: OrgTask.TASK_TYPES.reminder }];
    const andFilter = { $and: andArray };

    const tasks = await this.context.dbManager.getDiscordRows(this.context.dbManager.tasksTable, this.orgId, andFilter);

    if (tasks.length === 0) {
      return this.langManager.getString('command_reminders_no_reminders');
    }

    let result = '';
    for (const task of tasks) {
      result += this.langManager.getString(
        'command_reminders_reminder',
        task.id,
        TimeArg.toString(task.time.definitions, this.langManager),
        DiscordUtils.makeChannelMention(task.content.channel),
        task.content.message
      );
    }

    return result;
  }
}

/**
 * Exports the RemindersCommand class
 * @type {RemindersCommand}
 */
module.exports = RemindersCommand;

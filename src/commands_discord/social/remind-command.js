'use strict';

/**
 * @module remind-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const CommandPermissionFilter = require('../../command_meta/command-permission-filter');
const CommandPermissionFilterField = require('../../command_meta/command-permission-filter-field');
const FullStringArgScanner = require('../../arg_scanners/full-string-arg-scanner');
const DiscordTimeArgScanner = require('../../arg_scanners/discord-time-arg-scanner');
const DiscordChannelsArgScanner = require('../../arg_scanners/discord-channels-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const OrgTask = require('../../mongo_classes/org-task');

const RemindCommandArgDefs = Object.freeze({
  time: new CommandArgDef('time', {
    aliasIds: ['command_remind_arg_time_alias_time', 'command_remind_arg_time_alias_t'],
    helpId: 'command_remind_arg_time_help',
    scanner: DiscordTimeArgScanner,
    validationOptions: { isTime: true }
  }),
  channelIds: new CommandArgDef('channelIds', {
    aliasIds: ['command_remind_arg_channelIds_alias_channelIds', 'command_remind_arg_channelIds_alias_c'],
    helpId: 'command_remind_arg_channelIds_help',
    skipInSequentialRead: true,
    scanner: DiscordChannelsArgScanner,
    validationOptions: { validTextChannels: true }
  }),
  message: new CommandArgDef('message', {
    aliasIds: ['command_remind_arg_message_alias_message', 'command_remind_arg_message_alias_m'],
    helpId: 'command_remind_arg_message_help',
    scanner: FullStringArgScanner,
    validationOptions: { nonNull: true }
  })
});

/**
 * Command to set up a reminder in a text-channel.
 * @alias RemindCommand
 * @extends DiscordCommand
 */
class RemindCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new RemindCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_remind_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return RemindCommandArgDefs;
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
    return langManager.getString('command_remind_help');
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
          RemindCommandArgDefs.channelIds.name
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
      case RemindCommandArgDefs.channelIds:
        return message.channel.id;
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
    let result = '';
    let taskAdded = false;

    const tasks = await this.context.dbManager.getDiscordRows(this.context.dbManager.tasksTable, this.orgId, {
      type: OrgTask.TASK_TYPES.reminder
    });

    if (tasks.length + this.channelIds.channels.length > this.context.prefsManager.max_reminders_per_discord_org) {
      return this.langManager.getString(
        'command_remind_too_many_reminders',
        this.context.prefsManager.max_reminders_per_discord_org
      );
    }

    const currentRows = await this.context.dbManager.getDiscordRows(this.context.dbManager.tasksTable, this.orgId);
    const maxIndex = OhUtils.findMaxId(currentRows);

    let newId = maxIndex + 1;

    const insertTaskResults = [];
    for (let i = 0; i < this.channelIds.channels.length; i++) {
      const content = { channel: this.channelIds.channels[i], message: this.message };

      const reminderRow = {
        id: newId++,
        source: this.source,
        orgId: this.orgId,
        type: OrgTask.TASK_TYPES.reminder,
        time: OrgTask.parseTimeArg(this.time),
        content
      };

      insertTaskResults.push(
        this.context.dbManager.insertOne(this.context.dbManager.tasksTable, reminderRow).then(rowResult => {
          if (rowResult) {
            result = result + this.langManager.getString('command_remind_success') + '\n';
            taskAdded = true;
          } else {
            result = result + this.langManager.getString('command_remind_duplicate') + '\n';
          }
        })
      );
    }

    await Promise.all(insertTaskResults);

    if (taskAdded) {
      await this.context.scheduler.syncTasks();
    }

    return result;
  }
}

/**
 * Exports the RemindCommand class
 * @type {RemindCommand}
 */
module.exports = RemindCommand;

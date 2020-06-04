'use strict';

/**
 * @module delete-reminder-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const CommandPermissionFilter = require('../../command_meta/command-permission-filter');
const CommandPermissionFilterField = require('../../command_meta/command-permission-filter-field');
const DiscordChannelsArg = require('../../command_meta/discord-channels-arg');
const ArrayArgScanner = require('../../arg_scanners/array-arg-scanner');

const RemindersCommand = require('./reminders-command');

const PermissionsManager = require('../../managers/permissions-manager');

const OrgTask = require('../../mongo_classes/org-task');

const DeleteReminderCommandArgDefs = Object.freeze({
  ids: new CommandArgDef('ids', {
    aliasIds: ['command_deletereminder_arg_ids_alias_ids', 'command_deletereminder_arg_ids_alias_i'],
    helpId: 'command_deletereminder_arg_ids_help',
    scanner: ArrayArgScanner,
    validationOptions: { isIdsArray: true }
  })
});

/**
 * Command to reminders according to their ids in the Discord server.
 * @alias DeleteReminderCommand
 * @extends DiscordCommand
 */
class DeleteReminderCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {string}      orgId              the organization identifier
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, orgId, commandLangManager) {
    return new DeleteReminderCommand(context, source, orgId, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_deletereminder_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return DeleteReminderCommandArgDefs;
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
    return langManager.getString(
      'command_deletereminder_help',
      langManager.getString(RemindersCommand.getCommandInterfaceName())
    );
  }

  /**
   * Gets the array of defined Bot's permission filters for the command.
   * Source-defined permissions (e.g. Discord permissions) should be defined in another place.
   * @return {Array<CommandPermissionFilter>} the array of Bot's permission filters
   */
  static getRequiredBotPermissions() {
    return [
      new CommandPermissionFilter(PermissionsManager.DEFINED_PERMISSIONS.remind.name, [
        new CommandPermissionFilterField(PermissionsManager.DEFINED_FILTERS.channelId.name, 'channelIds')
      ])
    ];
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {Message}  discordMessage the command's message
   * @return {Promise}                 nothing
   */
  async validateFromDiscord(discordMessage) {
    await super.validateFromDiscord(discordMessage);

    // Set channelIds for the PermissionsManager
    const channels = [];
    const idsToDelete = this.ids.map(a => Number.parseInt(a, 10));
    this.tasks = await this.context.dbManager.getDiscordRows(this.context.dbManager.tasksTable, this.orgId, {
      type: OrgTask.TASK_TYPES.reminder
    });
    const tasksIds = new Set(this.tasks.map(a => a.id));

    for (const idToDelete of idsToDelete) {
      if (tasksIds.has(idToDelete)) {
        const task = this.tasks.filter(value => {
          return idToDelete === value.id;
        })[0];
        channels.push(task.content.channel);
      }
    }

    this.channelIds = new DiscordChannelsArg(channels);
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
    if (this.channelIds.length === 0) {
      return this.langManager.getString('command_deletereminder_no_ids_found');
    }

    const orArray = [];
    for (let i = 0; i < this.ids.length; i++) {
      orArray.push({ id: Number.parseInt(this.ids[i], 10) });
    }

    const deleteQuery = { $or: orArray };
    await this.context.dbManager.deleteDiscordRows(this.context.dbManager.tasksTable, this.orgId, deleteQuery);
    await this.context.scheduler.syncTasks();

    return this.langManager.getString('command_deletereminder_success');
  }
}

/**
 * Exports the DeleteReminderCommand class
 * @type {DeleteReminderCommand}
 */
module.exports = DeleteReminderCommand;

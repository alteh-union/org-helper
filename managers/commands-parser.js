'use strict';

/**
 * @module commands-parser
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const LangManager = require('./lang-manager');

const BotPublicError = require('../utils/bot-public-error');
const DiscordUtils = require('../utils/discord-utils');

const BotTable = require('../mongo_classes/bot-table');
const ServerSettingsTable = require('../mongo_classes/server-settings-table');
const UserSettingsTable = require('../mongo_classes/user-settings-table');

const DiscordCommand = require('../commands_discord/discord-command');

const AddBadWordsCommand = require('../commands_discord/settings/add-bad-words-command');
const AddRoleCommand = require('../commands_discord/moderation/add-role-command');
const AddRoleManagerCommand = require('../commands_discord/permissions/add-role-manager-command');
const BadWordsCommand = require('../commands_discord/settings/bad-words-command');
const CleanCommand = require('../commands_discord/moderation/clean-command');
const DeleteReminderCommand = require('../commands_discord/social/delete-reminder-command');
const DenyRemindCommand = require('../commands_discord/permissions/deny-remind-command');
const HelpCommand = require('../commands_discord/other/help-command');
const MyPermissionsCommand = require('../commands_discord/permissions/my-permissions-command');
const MySettingsCommand = require('../commands_discord/settings/my-settings-command');
const PermissionsCommand = require('../commands_discord/permissions/permissions-command');
const PermitRemindCommand = require('../commands_discord/permissions/permit-remind-command');
const PingCommand = require('../commands_discord/other/ping-command');
const PollCommand = require('../commands_discord/social/poll-command');
const RemindCommand = require('../commands_discord/social/remind-command');
const RemindersCommand = require('../commands_discord/social/reminders-command');
const RemoveBadWordsCommand = require('../commands_discord/settings/remove-bad-words-command');
const RemoveRoleCommand = require('../commands_discord/moderation/remove-role-command');
const RemoveRoleManagerCommand = require('../commands_discord/permissions/remove-role-manager-command');
const SetCensoringCommand = require('../commands_discord/settings/set-censoring-command');
const SetLocaleCommand = require('../commands_discord/settings/set-locale-command');
const SetMyLocaleCommand = require('../commands_discord/settings/set-my-locale-command');
const SetMyTimezoneCommand = require('../commands_discord/settings/set-my-timezone-command');
const SetPrefixCommand = require('../commands_discord/settings/set-prefix-command');
const SetTimezoneCommand = require('../commands_discord/settings/set-timezone-command');
const SettingsCommand = require('../commands_discord/settings/settings-command');

/**
 * The defined Discord command classes.
 * @type {Array<constructor>}
 */
const DiscordCommands = Object.freeze([
  AddBadWordsCommand,
  AddRoleCommand,
  AddRoleManagerCommand,
  BadWordsCommand,
  CleanCommand,
  DeleteReminderCommand,
  DenyRemindCommand,
  HelpCommand,
  MyPermissionsCommand,
  MySettingsCommand,
  PermissionsCommand,
  PermitRemindCommand,
  PingCommand,
  PollCommand,
  RemindersCommand,
  RemindCommand,
  RemoveBadWordsCommand,
  RemoveRoleCommand,
  RemoveRoleManagerCommand,
  SetCensoringCommand,
  SetLocaleCommand,
  SetMyLocaleCommand,
  SetMyTimezoneCommand,
  SetPrefixCommand,
  SetTimezoneCommand,
  SettingsCommand
]);

/**
 * Parses and launches execution of the Bot's commands.
 * @alias CommandsParser
 */
class CommandsParser {
  /**
   * Constructs an instance of the class.
   * @param {Context} context the Bot's context
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Sets the Discord client for the instance.
   * @param {Client} client the Discord client
   */
  setDiscordClient(client) {
    this.discordClient = client;
  }

  /**
   * Gets the array of defined Discord command classes.
   * @return {Array<constructor>} the defined commands
   */
  getDefinedDiscordCommands() {
    return DiscordCommands;
  }

  /**
   * Tries to parse an incoming Discord message as a command and execute it, if possible.
   * In case the user forgot the command prefix or set an unexpected language, there should be a fallback
   * to parse the HelpCommand in the default locale and with the default prefix, even if the current
   * locale and the current prefix is different.
   *
   * The general flow of processing commands is the following:
   * 0) Determine which language should we use to parse the command
   * 1) Check if the incoming message a command
   * 2) If yes, get the corresponding class of the command and create it's instance
   * 3) Check which way we should parse arguments: sequentially or by name
   * 4) Scan the arguments
   * 5) Fill default values for unscanned arguments (at least with null values)
   * 6) Validate the arguments
   * 7) Check caller's permissions to launch command with such arguments
   * 8) Execute the command
   * 9) Respond back with the result of execution to the same channel
   *
   * If a problem happened due to user's actions on steps 4, 6, 7 (e.g. no permission to laucnh the command,
   * wrong arguments etc.) then abort the processing and respond back to the caller with information about the error.
   *
   * If a problem occured on some other step, then most probably it's an internal Bot's problem, so don't
   * pass details to the caller, instead suggest him to contact the Bot developers.
   * @see HelpCommand
   * @param  {Message}          discordMessage the incoming Discord message
   * @return {Promise<Boolean>}                true if a command was executed successfully, false otherwise
   */
  async parseDiscordCommand(discordMessage) {
    const currentPrefix = await this.context.dbManager.getSetting(BotTable.DISCORD_SOURCE, discordMessage.guild.id,
      ServerSettingsTable.SERVER_SETTINGS.commandPrefix.name, DiscordCommand.DEFAULT_COMMAND_PREFIX);

    const currentLocale = await this.context.dbManager.getSetting(BotTable.DISCORD_SOURCE, discordMessage.guild.id,
      ServerSettingsTable.SERVER_SETTINGS.localeName.name);

    const currentUserLocale = await this.context.dbManager.getUserSetting(BotTable.DISCORD_SOURCE,
      discordMessage.guild.id, discordMessage.author.id, UserSettingsTable.USER_SETTINGS.localeName.name);

    const commandLangManager = new LangManager(this.context.localizationPath,
      currentUserLocale === undefined ? currentLocale : currentUserLocale);

    if (!discordMessage.content.startsWith(currentPrefix) && discordMessage.content.startsWith(
      DiscordCommand.DEFAULT_COMMAND_PREFIX)) {
      const fallbackCommandName = discordMessage.content.slice(DiscordCommand.DEFAULT_COMMAND_PREFIX.length,
        discordMessage.content.includes(' ') ?
          discordMessage.content.indexOf(' ') : discordMessage.content.length);

      if (fallbackCommandName === this.context.langManager.getString(HelpCommand.getCommandInterfaceName()) ||
          fallbackCommandName === commandLangManager.getString(HelpCommand.getCommandInterfaceName())) {
        this.context.log.i('Found help command with default prefix: ' + discordMessage.content);
        await this.executeDiscordCommand(discordMessage, HelpCommand, commandLangManager);
        return true;
      }

      return false;
    }

    if (!discordMessage.content.startsWith(currentPrefix)) {
      return false;
    }

    const commandName = discordMessage.content.slice(currentPrefix.length,
      discordMessage.content.includes(' ') ? discordMessage.content.indexOf(' ') : discordMessage.content.length);
    this.context.log.i('parseDiscordCommand: command: ' + discordMessage.content + '; commandName: ' + commandName);

    let commandFound = false;
    for (const command of DiscordCommands) {
      if (commandName === commandLangManager.getString(command.getCommandInterfaceName())) {
        this.context.log.i('Found command: ' + discordMessage.content);
        commandFound = true;
        // False positive for ESLint, since we break the loop immediately.
        /* eslint-disable no-await-in-loop */
        await this.executeDiscordCommand(discordMessage, command, commandLangManager);
        /* eslint-enable no-await-in-loop */
        break;
      }
    }

    return commandFound;
  }

  /**
   * Executes a command from Discord source. Creates a command instance, parse arguments for it, checks
   * that the caller has necessary permissions and finally executes the instance.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * If there was no error, then replies to the channel with a string result generated by the command object.
   * @see DiscordCommand
   * @param  {Message}                      discordMessage     the message
   * @param  {constructor<DiscordCommand>}  commandClass       the command class/constructor
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise}                                         nothing
   */
  async executeDiscordCommand(discordMessage, commandClass, commandLangManager) {
    const command = await this.tryParseDiscordCommand(commandClass, discordMessage, commandLangManager);
    if (command === null) {
      return;
    }

    try {
      await this.context.permManager.checkDiscordCommandPermissions(this.discordClient, discordMessage, command);
    } catch (error) {
      this.context.log.w('executeDiscordCommand: Not permitted to execute: "' + discordMessage.content +
          '"; Error message: ' + error + '; stack: ' + error.stack);
      DiscordUtils.sendToTextChannel(discordMessage.channel,
        commandLangManager.getString('permission_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')));
      return;
    }

    let result;
    try {
      result = await command.executeForDiscord(discordMessage);
    } catch (error) {
      this.context.log.w('executeDiscordCommand: failed to execute command: "' + discordMessage.content +
          '"; Error message: ' + error + '; stack: ' + error.stack);
      DiscordUtils.sendToTextChannel(discordMessage.channel,
        commandLangManager.getString('execute_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')));
      return;
    }

    if (result !== undefined && result !== null && result !== '') {
      DiscordUtils.sendToTextChannel(discordMessage.channel, result);
    }
  }

  /**
   * Creates a command object based on a class, and parses arguments from the Discord message for it.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * @see DiscordCommand
   * @param  {constructor<DiscordCommand>}  commandClass       the command class/constructor
   * @param  {Message}                      discordMessage     the message
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise<DiscordCommand>}                         the command object with all arguments set up
   */
  async tryParseDiscordCommand(commandClass, discordMessage, commandLangManager) {
    const command = commandClass.createForOrg(this.context, BotTable.DISCORD_SOURCE, discordMessage.guild.id,
      commandLangManager);

    try {
      await command.parseFromDiscord(this.discordClient, discordMessage);
    } catch (error) {
      this.context.log.w('tryParseDiscordCommand: failed to parse command: "' + discordMessage.content +
          '"; Error message: ' + error + '; stack: ' + error.stack);
      DiscordUtils.sendToTextChannel(discordMessage.channel,
        commandLangManager.getString('validate_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error'),
          await new HelpCommand(this.context, BotTable.DISCORD_SOURCE, discordMessage.guild.id, commandLangManager)
            .getHelpCommandString(commandClass.getCommandInterfaceName())));
      return null;
    }

    return command;
  }
}

/**
 * Exports the CommandsParser class
 * @type {CommandsParser}
 */
module.exports = CommandsParser;

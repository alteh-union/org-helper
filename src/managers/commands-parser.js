'use strict';

/**
 * @module commands-parser
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const LangManager = require('./lang-manager');

const BotPublicError = require('../utils/bot-public-error');

const ServerSettingsTable = require('../mongo_classes/server-settings-table');
const UserSettingsTable = require('../mongo_classes/user-settings-table');

const HelpCommand = require('../commands_discord/other/help-command');

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
   * Tries to parse an incoming Discord message in a guild as a command and execute it, if possible.
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
   * @param  {BaseMessage}          message the incoming Discord message
   * @return {Promise<Boolean>}                true if a command was executed successfully, false otherwise
   */
  async processMessage(message) {
    const currentPrefix = await this.context.dbManager.getSetting(
      message.source.name,
      message.orgId,
      ServerSettingsTable.SERVER_SETTINGS.commandPrefix.name,
      message.source.DEFAULT_COMMAND_PREFIX
    );

    const commandLangManager = await this.getCommandLangManager(message);
    const command = this.parseMessage(message, currentPrefix, commandLangManager);
    if (command) {
      await this.executeCommand(message, command, commandLangManager);
    }
    return command !== null;
  }

  /**
   * Parse message to get a bot command
   * @param message
   * @param currentPrefix
   * @param commandLangManager
   * @returns {constructor|HelpCommand|null}
   */
  parseMessage(message, currentPrefix, commandLangManager) {
    if (
      !message.content.startsWith(currentPrefix) &&
      message.content.startsWith(message.source.DEFAULT_COMMAND_PREFIX)
    ) {
      const fallbackCommandName = message.content.slice(
        message.source.DEFAULT_COMMAND_PREFIX.length,
        message.content.includes(' ') ? message.content.indexOf(' ') : message.content.length
      );

      if (
        fallbackCommandName === this.context.langManager.getString(HelpCommand.getCommandInterfaceName()) ||
        fallbackCommandName === commandLangManager.getString(HelpCommand.getCommandInterfaceName())
      ) {
        this.context.log.i('Found help command with default prefix: ' + message.content);
        return HelpCommand;
      }

      return null;
    }

    if (!message.content.startsWith(currentPrefix)) {
      return null;
    }

    const commandName = message.content.slice(
      currentPrefix.length,
      message.content.includes(' ') ? message.content.indexOf(' ') : message.content.length
    );
    this.context.log.i('parseDiscordCommand: command: ' + message.content + '; commandName: ' + commandName);

    for (const command of message.source.commandManager.definedCommands) {
      if (commandName === commandLangManager.getString(command.getCommandInterfaceName())) {
        this.context.log.i('Found command: ' + message.content);
        return command;
      }
    }

    return null;
  }

  /**
   * Get command lang manager based on message locale
   * @param message
   * @returns {Promise<void>}
   */
  async getCommandLangManager(message) {
    const currentLocale = await this.context.dbManager.getSetting(
      message.source.name,
      message.orgId,
      ServerSettingsTable.SERVER_SETTINGS.localeName.name
    );

    const currentUserLocale = await this.context.dbManager.getUserSetting(
      message.source.name,
      message.orgId,
      message.userId,
      UserSettingsTable.USER_SETTINGS.localeName.name
    );

    return new LangManager(
      this.context.localizationPath,
      currentUserLocale === undefined ? currentLocale : currentUserLocale
    );
  }

  /**
   * Tries to parse an incoming Discord private ("DM") message as a command and execute it, if possible.
   * Processing is somewhat similar to the gu8ld commands, but with respect to the fact that there is no
   * guild, so cannot use guild settings etc.
   * @todo To consider implementing user settings not related to any guild.
   * @see CommandsParser#processMessage
   * @param  {BaseMessage}         message the incoming Discord message
   * @return {Promise<Boolean>}                true if a command was executed successfully, false otherwise
   */
  async parsePrivateDiscordCommand(message) {
    const commandLangManager = this.context.langManager;
    const currentPrefix = message.source.DEFAULT_COMMAND_PREFIX;
    if (!message.content.startsWith(currentPrefix)) {
      return false;
    }

    const commandName = message.content.slice(
      currentPrefix.length,
      message.content.includes(' ') ? message.content.indexOf(' ') : message.content.length
    );
    this.context.log.i('parsePrivateDiscordCommand: command: ' + message.content + '; commandName: ' + commandName);

    let commandFound = false;
    for (const command of message.source.commandManager.definedPrivateCommands) {
      if (commandName === commandLangManager.getString(command.getCommandInterfaceName())) {
        this.context.log.i('Found private command: ' + message.content);
        commandFound = true;
        // False positive for ESLint, since we break the loop immediately.
        /* eslint-disable no-await-in-loop */
        await this.executePrivateDiscordCommand(message, command, commandLangManager);
        /* eslint-enable no-await-in-loop */
        break;
      }
    }

    return commandFound;
  }

  /**
   * Executes a command from Discord source. Creates a command instance, parses arguments for it, checks
   * that the caller has necessary permissions and finally executes the instance.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * If there was no error, then replies to the channel with a string result generated by the command object.
   * @see DiscordCommand
   * @param  {BaseMessage}                     message     the message
   * @param  {constructor<DiscordCommand>}  commandClass       the command class/constructor
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise}                                         nothing
   */
  async executeCommand(message, commandClass, commandLangManager) {
    const command = await this.tryParseDiscordCommand(commandClass, message, commandLangManager);
    if (command === null) {
      return;
    }

    try {
      await this.context.permManager.checkDiscordCommandPermissions(message, command);
    } catch (error) {
      this.context.log.w(
        'executeCommand: Not permitted to execute: "' +
          message.content +
          '"; Error message: ' +
          error +
          '; stack: ' +
          error.stack
      );
      message.reply(
        commandLangManager.getString(
          'permission_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
        )
      );
      return;
    }

    let result;
    try {
      result = await command.executeForDiscord(message);
    } catch (error) {
      this.context.log.w(
        'executeCommand: failed to execute command: "' +
          message.content +
          '"; Error message: ' +
          error +
          '; stack: ' +
          error.stack
      );
      message.reply(
        commandLangManager.getString(
          'execute_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
        )
      );
      return;
    }

    if (result !== undefined && result !== null && result !== '') {
      message.reply(result);
    }
  }

  /**
   * Executes a private ("DM") command from Discord source. Creates a command instance,
   * parses arguments for it and executes the instance.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * If there was no error, then replies to the channel with a string result generated by the command object.
   * @see DiscordPrivateCommand
   * @param  {BaseMessage}                      message     the message
   * @param  {constructor<DiscordCommand>}  commandClass       the command class/constructor
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise}                                         nothing
   */
  async executePrivateDiscordCommand(message, commandClass, commandLangManager) {
    const command = await this.tryParsePrivateDiscordCommand(commandClass, message, commandLangManager);
    if (command === null) {
      return;
    }

    let result;
    try {
      result = await command.executeForDiscord(message);
    } catch (error) {
      this.context.log.w(
        'executePrivateDiscordCommand: failed to execute command: "' +
          message.content +
          '"; Error message: ' +
          error +
          '; stack: ' +
          error.stack
      );
      message.reply(
        commandLangManager.getString(
          'execute_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
        )
      );
      return;
    }

    if (result !== undefined && result !== null && result !== '') {
      message.reply(result);
    }
  }

  /**
   * Creates a command object based on a class, and parses arguments from the Discord message for it.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * @see DiscordCommand
   * @param  {constructor<DiscordCommand>}  commandClass       the command class/constructor
   * @param  {BaseMessage}                      message     the message
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise<DiscordCommand>}                         the command object with all arguments set up
   */
  async tryParseDiscordCommand(commandClass, message, commandLangManager) {
    const command = commandClass.createForOrg(this.context, message.source.name, commandLangManager, message.orgId);

    try {
      await command.parseFromDiscord(message);
    } catch (error) {
      this.context.log.w(
        'tryParseDiscordCommand: failed to parse command: "' +
          message.content +
          '"; Error message: ' +
          error +
          '; stack: ' +
          error.stack
      );
      message.reply(
        commandLangManager.getString(
          'validate_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error'),
          await new HelpCommand(
            this.context,
            message.source.name,
            commandLangManager,
            message.orgId
          ).getHelpCommandString(commandClass.getCommandInterfaceName(), message.source)
        )
      );
      return null;
    }

    return command;
  }

  /**
   * Creates a private ("DM") command object based on a class, and parses arguments from the Discord message for it.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * @see DiscordCommand
   * @param  {constructor<DiscordCommand>}  commandClass       the command class/constructor
   * @param  {BaseMessage}                     message     the message
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise<DiscordCommand>}                         the command object with all arguments set up
   */
  async tryParsePrivateDiscordCommand(commandClass, message, commandLangManager) {
    const command = commandClass.createForUser(this.context, message.source.name, commandLangManager);

    try {
      await command.parseFromDiscord(message);
    } catch (error) {
      this.context.log.w(
        'tryParsePrivateDiscordCommand: failed to parse command: "' +
          message.content +
          '"; Error message: ' +
          error +
          '; stack: ' +
          error.stack
      );
      message.reply(
        commandLangManager.getString(
          'validate_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error'),
          '' // @todo Create a private HelpCommand class and use it here to provide help on the private commands.
        )
      );
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

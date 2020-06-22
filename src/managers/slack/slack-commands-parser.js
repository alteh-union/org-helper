'use strict';

/**
 * @module commands-parser
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const LangManager = require('../lang-manager');

const BotPublicError = require('../../utils/bot-public-error');
const SlackUtils = require('../../utils/slack-utils');

const BotTable = require('../../mongo_classes/bot-table');
const ServerSettingsTable = require('../../mongo_classes/server-settings-table');
const UserSettingsTable = require('../../mongo_classes/user-settings-table');

const SlackCommand = require('../../commands/commands_slack/slack-command');

const HelpCommand = require('../../commands/commands_slack/help-command');
const PingCommand = require('../../commands/commands_slack/ping-command');


/**
 * The defined Slack command classes.
 * @type {Array<constructor>}
 */
const SlackCommands = Object.freeze([
  PingCommand
]);

/**
 * The defined private Slack command classes.
 * @type {Array<constructor>}
 */
const SlackPrivateCommands = Object.freeze([]);

/**
 * Parses and launches execution of the Bot's commands.
 * @alias CommandsParser
 */
class SlackCommandsParser {
  /**
   * Constructs an instance of the class.
   * @param {Context} context the Bot's context
   * @param {WebClient} webClient for the Slack API
   */
  constructor(context, webClient) {
    this.context = context;
    this.webClient = webClient;
  }

  /**
   * Sets the Slack client for the instance.
   * @param {Client} client the Slack client
   */
  setSlackClient(client) {
    this.slackClient = client;
  }

  /**
   * Gets the array of defined Slack command classes.
   * @return {Array<constructor>} the defined commands
   */
  getDefinedSlackCommands() {
    return SlackCommands;
  }

  /**
   * Tries to parse an incoming Slack message in a guild as a command and execute it, if possible.
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
   * @param  {Message}          slackMessage the incoming Slack message
   * @return {Promise<Boolean>}                true if a command was executed successfully, false otherwise
   */
  async processSlackCommand(slackMessage) {
    const currentPrefix = await this.context.dbManager.getSetting(
      BotTable.SLACK_SOURCE,
      slackMessage.team_id,
      ServerSettingsTable.SERVER_SETTINGS.commandPrefix.name,
      SlackCommand.DEFAULT_COMMAND_PREFIX
    );

    const commandLangManager = await this.getCommandLangManager(slackMessage);
    const command = await this.parseSlackCommand(slackMessage, commandLangManager, currentPrefix);
    if (command) {
      await this.executeSlackCommand(slackMessage, command, commandLangManager);
    }
  }

  async parseSlackCommand(slackMessage, commandLangManager, currentPrefix) {
    if (
      !slackMessage.text.startsWith(currentPrefix) &&
      slackMessage.text.startsWith(SlackCommand.DEFAULT_COMMAND_PREFIX)
    ) {
      const fallbackCommandName = slackMessage.text.slice(
        SlackCommand.DEFAULT_COMMAND_PREFIX.length,
        slackMessage.text.includes(' ') ? slackMessage.text.indexOf(' ') : slackMessage.text.length
      );

      if (
        fallbackCommandName === this.context.langManager.getString(HelpCommand.getCommandInterfaceName()) ||
        fallbackCommandName === commandLangManager.getString(HelpCommand.getCommandInterfaceName())
      ) {
        this.context.log.i('Found help command with default prefix: ' + slackMessage.text);
        return HelpCommand;
      }

      return null;
    }

    if (!slackMessage.text.startsWith(currentPrefix)) {
      return null;
    }

    const commandName = slackMessage.text.slice(
      currentPrefix.length,
      slackMessage.text.includes(' ') ? slackMessage.text.indexOf(' ') : slackMessage.text.length
    );
    this.context.log.i('parseSlackCommand: command: ' + slackMessage.text + '; commandName: ' + commandName);

    for (const command of SlackCommands) {
      if (commandName === commandLangManager.getString(command.getCommandInterfaceName())) {
        this.context.log.i('Found command: ' + slackMessage.text);
        // False positive for ESLint, since we break the loop immediately.
        /* eslint-disable no-await-in-loop */
        return command;
      }
    }

    return null;
  }

  async getCommandLangManager(slackMessage) {
    const currentLocale = await this.context.dbManager.getSetting(
      BotTable.SLACK_SOURCE,
      slackMessage.team_id,
      ServerSettingsTable.SERVER_SETTINGS.localeName.name
    );

    const currentUserLocale = await this.context.dbManager.getUserSetting(
      BotTable.SLACK_SOURCE,
      slackMessage.team_id,
      slackMessage.user,
      UserSettingsTable.USER_SETTINGS.localeName.name
    );

    const commandLangManager = new LangManager(
      this.context.localizationPath,
      currentUserLocale === undefined ? currentLocale : currentUserLocale
    );
    return commandLangManager;
  }

  /**
   * Tries to parse an incoming Slack private ("DM") message as a command and execute it, if possible.
   * Processing is somewhat similar to the gu8ld commands, but with respect to the fact that there is no
   * guild, so cannot use guild settings etc.
   * @todo To consider implementing user settings not related to any guild.
   * @see CommandsParser#parseSlackCommand
   * @param  {Message}          slackMessage the incoming Slack message
   * @return {Promise<Boolean>}                true if a command was executed successfully, false otherwise
   */
  async parsePrivateSlackCommand(slackMessage) {
    const commandLangManager = this.context.langManager;
    const currentPrefix = SlackCommand.DEFAULT_COMMAND_PREFIX;
    if (!slackMessage.text.startsWith(currentPrefix)) {
      return false;
    }

    const commandName = slackMessage.text.slice(
      currentPrefix.length,
      slackMessage.text.includes(' ') ? slackMessage.text.indexOf(' ') : slackMessage.text.length
    );
    this.context.log.i(
      'parsePrivateSlackCommand: command: ' + slackMessage.text + '; commandName: ' + commandName
    );

    let commandFound = false;
    for (const command of SlackPrivateCommands) {
      if (commandName === commandLangManager.getString(command.getCommandInterfaceName())) {
        this.context.log.i('Found private command: ' + slackMessage.text);
        commandFound = true;
        // False positive for ESLint, since we break the loop immediately.
        /* eslint-disable no-await-in-loop */
        await this.executePrivateSlackCommand(slackMessage, command, commandLangManager);
        /* eslint-enable no-await-in-loop */
        break;
      }
    }

    return commandFound;
  }

  /**
   * Executes a command from Slack source. Creates a command instance, parses arguments for it, checks
   * that the caller has necessary permissions and finally executes the instance.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * If there was no error, then replies to the channel with a string result generated by the command object.
   * @see SlackCommand
   * @param  {Message}                      slackMessage     the message
   * @param  {constructor<SlackCommand>}  commandClass       the command class/constructor
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise}                                         nothing
   */
  async executeSlackCommand(slackMessage, commandClass, commandLangManager) {
    const command = await this.tryParseSlackCommand(commandClass, slackMessage, commandLangManager);
    if (command === null) {
      return;
    }

    try {
      await this.context.slackPermManager.checkSlackCommandPermissions(this.slackClient, slackMessage, command);
    } catch (error) {
      this.context.log.w(
        'executeSlackCommand: Not permitted to execute: "' +
        slackMessage.text +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack
      );
      SlackUtils.sendToTextChannel(
        slackMessage.channel,
        commandLangManager.getString(
          'permission_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
        ),this.webClient
      );
      return;
    }

    let result;
    try {
      result = await command.executeForSlack(slackMessage);
    } catch (error) {
      this.context.log.w(
        'executeSlackCommand: failed to execute command: "' +
        slackMessage.text +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack
      );
      SlackUtils.sendToTextChannel(
        slackMessage.channel,
        commandLangManager.getString(
          'execute_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
        ), this.webClient);
      return;
    }

    if (result !== undefined && result !== null && result !== '') {
      SlackUtils.sendToTextChannel(slackMessage.channel, result,this.webClient);
    }
  }

  /**
   * Executes a private ("DM") command from Slack source. Creates a command instance,
   * parses arguments for it and executes the instance.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * If there was no error, then replies to the channel with a string result generated by the command object.
   * @see SlackPrivateCommand
   * @param  {Message}                      slackMessage     the message
   * @param  {constructor<SlackCommand>}  commandClass       the command class/constructor
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise}                                         nothing
   */
  async executePrivateSlackCommand(slackMessage, commandClass, commandLangManager) {
    const command = await this.tryParsePrivateSlackCommand(commandClass, slackMessage, commandLangManager);
    if (command === null) {
      return;
    }

    let result;
    try {
      result = await command.executeForSlack(slackMessage);
    } catch (error) {
      this.context.log.w(
        'executePrivateSlackCommand: failed to execute command: "' +
        slackMessage.text +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack
      );
      SlackUtils.sendToTextChannel(
        slackMessage.channel,
        commandLangManager.getString(
          'execute_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
        )
      );
      return;
    }

    if (result !== undefined && result !== null && result !== '') {
      SlackUtils.sendToTextChannel(slackMessage.channel, result);
    }
  }

  /**
   * Creates a command object based on a class, and parses arguments from the Slack message for it.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * @see SlackCommand
   * @param  {constructor<SlackCommand>}  commandClass       the command class/constructor
   * @param  {Message}                      slackMessage     the message
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise<SlackCommand>}                         the command object with all arguments set up
   */
  async tryParseSlackCommand(commandClass, slackMessage, commandLangManager) {
    const command = commandClass.createForOrg(
      this.context,
      BotTable.SLACK_SOURCE,
      commandLangManager,
      slackMessage.team_id
    );

    try {
      await command.parseFromSlack(this.slackClient, slackMessage);
    } catch (error) {
      this.context.log.w(
        'tryParseSlackCommand: failed to parse command: "' +
        slackMessage.text +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack
      );
      SlackUtils.sendToTextChannel(
        slackMessage.channel,
        commandLangManager.getString(
          'validate_command_error',
          error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error'),
          await new HelpCommand(
            this.context,
            BotTable.SLACK_SOURCE,
            commandLangManager,
            slackMessage.team_id
          ).getHelpCommandString(commandClass.getCommandInterfaceName())
        )
      );
      return null;
    }

    return command;
  }

  /**
   * Creates a private ("DM") command object based on a class, and parses arguments from the Slack message for it.
   * If there were errors during parsing then replies to the source text channel with info about the error.
   * @see SlackCommand
   * @param  {constructor<SlackCommand>}  commandClass       the command class/constructor
   * @param  {Message}                      slackMessage     the message
   * @param  {LangManager}                  commandLangManager the language manager to be used for the command
   * @return {Promise<SlackCommand>}                         the command object with all arguments set up
   */
  async tryParsePrivateSlackCommand(commandClass, slackMessage, commandLangManager) {
    const command = commandClass.createForUser(this.context, BotTable.SLACK_SOURCE, commandLangManager);

    try {
      await command.parseFromSlack(this.slackClient, slackMessage);
    } catch (error) {
      this.context.log.w(
        'tryParsePrivateSlackCommand: failed to parse command: "' +
        slackMessage.text +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack
      );
      SlackUtils.sendToTextChannel(
        slackMessage.channel,
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
module.exports = SlackCommandsParser;

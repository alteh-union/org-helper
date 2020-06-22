'use strict';

/**
 * @module help-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../../utils/bot-utils');
const ServerSettingsTable = require('../../../mongo_classes/server-settings-table');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../../command_meta/command-arg-def');

const AllArgId = 'command_help_all_arg_value';

const MaxSuggestedCommands = 5;

const HelpCommandArgDefs = Object.freeze({
  command: new CommandArgDef('command', {
    aliasIds: ['command_help_arg_command_alias_command', 'command_help_arg_command_alias_c'],
    helpId: 'command_help_arg_command_help'
  })
});

/**
 * Command to display help info about the Bot.
 * @alias HelpCommand
 * @extends DiscordCommand
 */
class HelpCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new HelpCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_help_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return HelpCommandArgDefs;
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
    return langManager.getString('command_help_help', langManager.getString(AllArgId));
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

    const currentPrefix = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.commandPrefix.name,
      DiscordCommand.DEFAULT_COMMAND_PREFIX
    );

    if (this.command === null || this.langManager.getString(AllArgId) === this.command) {
      let commands = this.context.discordCommandsParser.getDefinedDiscordCommands();
      if (
        this.langManager.getString(AllArgId) !== this.command &&
        !this.context.discordPermManager.isAuthorAdmin(discordMessage)
      ) {
        commands = commands.filter((value, index, array) => {
          return !value.getRequiredDiscordPermissions().includes(this.getPermManager().DISCORD_PERMISSIONS.ADMINISTRATOR);
        });
      }

      result = this.langManager.getString(
        'command_help_summary',
        currentPrefix + this.langManager.getString(HelpCommand.getCommandInterfaceName())
      );
      for (const command of commands) {
        result =
          result +
          currentPrefix +
          this.langManager.getString(command.getCommandInterfaceName()) +
          ' : ' +
          command.getHelpText(this.context, this.langManager) +
          '\n';
      }
    } else {
      const commands = this.context.commandsParser.getDefinedDiscordCommands();
      let selectedCommand = null;
      for (const command of commands) {
        if (this.langManager.getString(command.getCommandInterfaceName()) === this.command) {
          selectedCommand = command;
          break;
        }
      }

      if (selectedCommand === null) {
        const commandNames = [];
        for (const command of commands) {
          commandNames.push(this.langManager.getString(command.getCommandInterfaceName()));
        }

        const suggestedCommands = OhUtils.makeSuggestions(this.command, commandNames, MaxSuggestedCommands);
        result = this.langManager.getString('command_help_wrong_command', suggestedCommands.join(', '));
      } else {
        result = selectedCommand.getHelpText(this.context, this.langManager) + '\n';
        const argsArray = Object.values(selectedCommand.getDefinedArgs());
        for (const arg of argsArray) {
          let aliases = '';
          for (let j = 0; j < arg.aliasIds.length; j++) {
            aliases = aliases + DiscordCommand.ARG_PREFIX + this.langManager.getString(arg.aliasIds[j]) + ' ';
          }

          result = result + aliases + ': ' + this.langManager.getString(arg.helpId) + '\n';
        }
      }
    }

    return result;
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this functions.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {Message}         discordMessage the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async getHelpCommandString(commandName) {
    const currentPrefix = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.commandPrefix.name,
      DiscordCommand.DEFAULT_COMMAND_PREFIX
    );

    return (
      currentPrefix +
      this.langManager.getString(HelpCommand.getCommandInterfaceName()) +
      ' ' +
      this.langManager.getString(commandName)
    );
  }
}

/**
 * Exports the HelpCommand class
 * @type {HelpCommand}
 */
module.exports = HelpCommand;

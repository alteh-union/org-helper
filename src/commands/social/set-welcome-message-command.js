'use strict';

/**
 * @module set-welcome-message-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');

const FullStringArgScanner = require('../../arg_scanners/full-string-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const SetWelcomeMessageCommandArgDefs = Object.freeze({
  welcomeMessage: new CommandArgDef('welcomeMessage', {
    aliasIds: ['command_setwelcomemessage_arg_welcomeMessage_alias_welcomeMessage',
      'command_setwelcomemessage_arg_welcomeMessage_alias_m'],
    helpId: 'command_setwelcomemessage_arg_welcomeMessage_help',
    scanner: FullStringArgScanner
  })
});

/**
 * Command to set the welcome message for the org.
 * It should be posted by the Bot to the main channel as soon as a new user is added to the org.
 * @alias SetWelcomeMessageCommand
 * @extends Command
 */
class SetWelcomeMessageCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new SetWelcomeMessageCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_setwelcomemessage_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_setwelcomemessage_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SetWelcomeMessageCommandArgDefs;
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
    return langManager.getString('command_setwelcomemessage_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [PermissionsManager.DISCORD_PERMISSIONS.ADMINISTRATOR];
  }

  /**
   * Gets the array of defined Telegram permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Telegram-specific permissions required
   */
  static getRequiredTelegramPermissions() {
    return [PermissionsManager.TELEGRAM_PERMISSIONS.ADMINISTRATOR];
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    if (this.welcomeMessage) {
      await this.context.dbManager.setSetting(
        this.source,
        this.orgId,
        ServerSettingsTable.SERVER_SETTINGS.welcomeMessage.name,
        this.welcomeMessage
      );

      return this.langManager.getString('command_setwelcomemessage_success');
    } else {
      await this.context.dbManager.removeSetting(
        this.source,
        this.orgId,
        ServerSettingsTable.SERVER_SETTINGS.welcomeMessage.name
      );

      return this.langManager.getString('command_setwelcomemessage_success_empty');
    }
  }
}

/**
 * Exports the SetWelcomeMessageCommand class
 * @type {SetWelcomeMessageCommand}
 */
module.exports = SetWelcomeMessageCommand;

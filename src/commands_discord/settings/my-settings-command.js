'use strict';

/**
 * @module my-settings-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotPublicError = require('../../utils/bot-public-error');

const SettingsCommand = require('./settings-command');

const UserSettingsTable = require('../../mongo_classes/user-settings-table');

/**
 * Command to list settings set up for the user in the Discord server.
 * @alias MySettingsCommand
 * @extends SettingsCommand
 */
class MySettingsCommand extends SettingsCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {string}      orgId              the organization identifier
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, orgId, commandLangManager) {
    return new MySettingsCommand(context, source, orgId, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_mysettings_name';
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
    return langManager.getString('command_mysettings_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [];
  }

  /**
   * Get settings which need to skip in the common output.
   * @return {Array<string>} array of settings name
   */
  static getSettingsToSkip() {
    return [];
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

    if (this.setting !== null) {
      const availableSettings = Object.values(UserSettingsTable.USER_SETTINGS);
      const localizedSettings = availableSettings.map(a => this.langManager.getString(a.textId));
      if (!localizedSettings.includes(this.setting)) {
        throw new BotPublicError(
          this.langManager.getString(
            'command_mysettings_error_wrong_setting',
            this.setting,
            localizedSettings.join(', ')
          )
        );
      }
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
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.getSettingsDescription(
      discordMessage,
      UserSettingsTable.USER_SETTINGS,
      'command_mysettings_empty_setting',
      this.context.dbManager.getUserSetting,
      true
    );
    /* eslint-enable no-return-await */
  }
}

/**
 * Exports the MySettingsCommand class
 * @type {MySettingsCommand}
 */
module.exports = MySettingsCommand;

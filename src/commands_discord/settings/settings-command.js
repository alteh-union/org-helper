'use strict';

/**
 * @module settings-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotPublicError = require('../../utils/bot-public-error');

const DiscordCommand = require('../discord-command');
const GetSettingSuggestions = require('../suggestions/get-setting-suggestions');

const CommandArgDef = require('../../command_meta/command-arg-def');
const ArrayArgScanner = require('../../arg_scanners/array-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const SettingsCommandArgDefs = Object.freeze({
  settings: new CommandArgDef('settings', {
    aliasIds: ['command_settings_arg_settings_alias_settings', 'command_settings_arg_settings_alias_s'],
    helpId: 'command_settings_arg_settings_help',
    scanner: ArrayArgScanner,
    suggestions: GetSettingSuggestions
  })
});

const SkipSettings = Object.freeze([ServerSettingsTable.SERVER_SETTINGS.badwords.name]);

/**
 * Command to list the settings of the Discord server.
 * @alias SettingsCommand
 * @extends DiscordCommand
 */
class SettingsCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new SettingsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_settings_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_settings_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SettingsCommandArgDefs;
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
    return langManager.getString('command_settings_help');
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
   * Get settings which need to skip in the common output.
   * @return {Array<string>} array of settings name
   */
  static getSettingsToSkip() {
    return SkipSettings;
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {BaseMessage}  message the command's message
   * @return {Promise}              nothing
   */
  async validateFromDiscord(message) {
    await super.validateFromDiscord(message);

    if (this.settings !== null && this.settings.length > 0) {
      const availableSettings = Object.values(ServerSettingsTable.SERVER_SETTINGS);
      const localizedSettings = availableSettings.map(a => this.langManager.getString(a.textId));
      for (const setting of localizedSettings) {
        if (!localizedSettings.find(ls => ls === setting)) {
          throw new BotPublicError(
            this.langManager.getString('command_settings_error_wrong_setting',
              setting, localizedSettings.join(', '))
          );
        }
      }
    }
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
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.getSettingsDescription(
      message,
      ServerSettingsTable.SERVER_SETTINGS,
      'command_settings_empty_setting',
      this.context.dbManager.getSetting,
      false
    );
    /* eslint-enable no-return-await */
  }

  /**
   * Makes a related settings description (certain settings if the settings arg is specified).
   * @param  {BaseMessage}    message           the Discord message with the command
   * @param  {Array<Object>}  availableSettings the array of available settings
   * @param  {string}         emptyTextId       the text id of string to be used if no settings are found
   * @param  {Function}       dbFunc            the DB function to fetch the settings
   * @param  {Boolean}        includeUser       true if need to include member id into the DB function call
   * @return {Promise<string>}                  the settings description as text
   */
  async getSettingsDescription(message, availableSettings, emptyTextId, dbFunc, includeUser) {
    dbFunc = dbFunc.bind(this.context.dbManager);
    if (this.settings !== null && this.settings.length > 0) {
      let result = '';
      for (const setting of this.settings) {
        const settingDefinition = Object.values(availableSettings)
          .find(as => this.langManager.getString(as.textId) === setting);
        const value = includeUser
          ? await dbFunc(this.source, this.orgId, message.userId, settingDefinition.name)
          : await dbFunc(this.source, this.orgId, settingDefinition.name);
        if (value !== undefined) {
          result += this.langManager.getString(settingDefinition.textId) + ' : ' + value + '\n';
        } else {
          result += this.langManager.getString(emptyTextId, setting) + '\n';
        }
      }
      return result;
    }

    const getResults = [];
    let result = '';
    const availableSettingsKeys = Object.keys(availableSettings);
    for (const settingKey of availableSettingsKeys) {
      if (this.constructor.getSettingsToSkip().includes(availableSettings[settingKey].name)) {
        continue;
      }

      getResults.push(
        (includeUser
          ? dbFunc(this.source, this.orgId, message.userId, availableSettings[settingKey].name)
          : dbFunc(this.source, this.orgId, availableSettings[settingKey].name)
        ).then(value => {
          if (value !== undefined) {
            result = result + this.langManager.getString(availableSettings[settingKey].textId) + ' : ' + value + '\n';
          }
        })
      );
    }

    await Promise.all(getResults);

    return result;
  }
}

/**
 * Exports the SettingsCommand class
 * @type {SettingsCommand}
 */
module.exports = SettingsCommand;

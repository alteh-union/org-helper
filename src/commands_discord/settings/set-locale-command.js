'use strict';

/**
 * @module set-locale-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const BotPublicError = require('../../utils/bot-public-error');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const SetLocaleCommandArgDefs = Object.freeze({
  locale: new CommandArgDef('locale', {
    aliasIds: ['command_setlocale_arg_locale_alias_locale', 'command_setlocale_arg_locale_alias_l'],
    helpId: 'command_setlocale_arg_locale_help',
    validationOptions: { nonNull: true },
  }),
});

/**
 * Command to set the server-wide language.
 * @see LangManager
 * @alias SetLocaleCommand
 * @extends DiscordCommand
 */
class SetLocaleCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {string}      orgId              the organization identifier
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, orgId, commandLangManager) {
    return new SetLocaleCommand(context, source, orgId, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_setlocale_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SetLocaleCommandArgDefs;
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
    return langManager.getString('command_setlocale_help');
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
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {Message}  discordMessage the command's message
   * @return {Promise}                 nothing
   */
  async validateFromDiscord(discordMessage) {
    await super.validateFromDiscord(discordMessage);

    const locales = this.langManager.getLocales();
    let found = false;
    const availableLocaleNames = [];
    for (const locale of locales) {
      availableLocaleNames.push(locale);
      if (locale === this.locale) {
        found = true;
        break;
      }
    }

    if (!found) {
      this.context.log.e('SetLocaleCommand validateFromDiscord: locale not found: ' + this.locale);
      throw new BotPublicError(
        this.langManager.getString('command_setlocale_error_wrong_locale', availableLocaleNames.join(', '))
      );
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
    await this.context.dbManager.setSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.localeName.name,
      this.locale
    );

    this.context.log.i('SetLocaleCommand done: new locale is ' + this.locale);
    return this.langManager.getString('command_setlocale_success', this.locale);
  }
}

/**
 * Exports the SetLocaleCommand class
 * @type {SetLocaleCommand}
 */
module.exports = SetLocaleCommand;

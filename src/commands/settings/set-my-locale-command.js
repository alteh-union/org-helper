'use strict';

/**
 * @module set-my-locale-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotPublicError = require('../../utils/bot-public-error');

const Command = require('../command');
const GetLocaleSuggestions = require('../suggestions/get-locale-suggestions');
const CommandArgDef = require('../../command_meta/command-arg-def');

const UserSettingsTable = require('../../mongo_classes/user-settings-table');

const SetMyLocaleCommandArgDefs = Object.freeze({
  locale: new CommandArgDef('locale', {
    aliasIds: ['command_setmylocale_arg_locale_alias_locale', 'command_setmylocale_arg_locale_alias_l'],
    helpId: 'command_setmylocale_arg_locale_help',
    suggestions: GetLocaleSuggestions
  })
});

/**
 * Command to set the language for the caller in the org.
 * @see LangManager
 * @alias SetMyLocaleCommand
 * @extends Command
 */
class SetMyLocaleCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new SetMyLocaleCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_setmylocale_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_setmylocale_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SetMyLocaleCommandArgDefs;
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
    return langManager.getString('command_setmylocale_help');
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {BaseMessage}  message the command's message
   * @return {Promise}              nothing
   */
  async validateArguments(message) {
    await super.validateArguments(message);

    if (this.locale === null) {
      return;
    }

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
      this.context.log.e('SetMyLocaleCommand validateArguments: locale not found: ' + this.locale);
      throw new BotPublicError(
        this.langManager.getString('command_setmylocale_error_wrong_locale', availableLocaleNames.join(', '))
      );
    }
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
    if (this.locale === null) {
      await this.context.dbManager.removeUserSetting(
        this.source,
        this.orgId,
        message.userId,
        UserSettingsTable.USER_SETTINGS.localeName.name
      );

      this.context.log.i("SetMyLocaleCommand done: removed the user's locale preference");
      return this.langManager.getString(
        'command_setmylocale_success_no_locale',
        await message.source.makeUserMention(message, message.userId)
      );
    }

    await this.context.dbManager.setUserSetting(
      this.source,
      this.orgId,
      message.userId,
      UserSettingsTable.USER_SETTINGS.localeName.name,
      this.locale
    );

    this.context.log.i("SetMyLocaleCommand done: new user's locale is " + this.locale);
    return this.langManager.getString(
      'command_setmylocale_success',
      await message.source.makeUserMention(message, message.userId),
      this.locale
    );
  }
}

/**
 * Exports the SetMyLocaleCommand class
 * @type {SetMyLocaleCommand}
 */
module.exports = SetMyLocaleCommand;

'use strict';

/**
 * @module set-my-timezone-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const momentTz = require('moment-timezone');
const stringSimilarity = require('string-similarity');

const BotPublicError = require('../../utils/bot-public-error');

const Command = require('../command');
const GetTimezoneSuggestions = require('../suggestions/get-timezone-suggestions');
const CommandArgDef = require('../../command_meta/command-arg-def');

const UserSettingsTable = require('../../mongo_classes/user-settings-table');

const MaxSimilarTimezones = 10;

const SetMyTimezoneCommandArgDefs = Object.freeze({
  timezone: new CommandArgDef('timezone', {
    aliasIds: [
      'command_setmytimezone_arg_timezone_alias_timezone',
      'command_setmytimezone_arg_timezone_alias_t',
      'command_setmytimezone_arg_timezone_alias_z'
    ],
    helpId: 'command_setmytimezone_arg_timezone_help',
    suggestions: GetTimezoneSuggestions
  })
});

/**
 * Command to set the timezone for the caller in the org.
 * @see DiscordTimeArgScanner.appendTimezone
 * @alias SetMyTimezoneCommand
 * @extends Command
 */
class SetMyTimezoneCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new SetMyTimezoneCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_setmytimezone_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_setmytimezone_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SetMyTimezoneCommandArgDefs;
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
    return langManager.getString('command_setmytimezone_help');
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

    if (this.timezone === null) {
      return;
    }

    const availableTimezones = momentTz.tz.names();

    if (!availableTimezones.includes(this.timezone)) {
      const proposedTimezones = [];
      const ratings = stringSimilarity.findBestMatch(this.timezone, availableTimezones).ratings;
      ratings.sort((a, b) => (a.rating > b.rating ? -1 : b.rating > a.rating ? 1 : 0));

      for (let i = 0; i < MaxSimilarTimezones; i++) {
        proposedTimezones.push(ratings[i].target);
      }

      throw new BotPublicError(
        this.langManager.getString('command_setmytimezone_error_wrong_timezone', proposedTimezones.join(', '))
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
    if (this.timezone === null) {
      await this.context.dbManager.removeUserSetting(
        this.source,
        this.orgId,
        message.userId,
        UserSettingsTable.USER_SETTINGS.timezone.name
      );

      this.context.log.i("SetMyTimezoneCommand done: removed the user's timezone preference");
      return this.langManager.getString(
        'command_setmytimezone_success_no_timezone',
        await message.source.makeUserMention(message, message.userId)
      );
    }

    await this.context.dbManager.setUserSetting(
      this.source,
      this.orgId,
      message.userId,
      UserSettingsTable.USER_SETTINGS.timezone.name,
      this.timezone
    );

    this.context.log.i('SetMyTimezoneCommand done: new prefix is ' + this.timezone);
    return this.langManager.getString('command_setmytimezone_success', this.timezone);
  }
}

/**
 * Exports the SetMyTimezoneCommand class
 * @type {SetMyTimezoneCommand}
 */
module.exports = SetMyTimezoneCommand;

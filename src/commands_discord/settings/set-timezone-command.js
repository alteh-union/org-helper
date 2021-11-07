'use strict';

/**
 * @module set-timezone-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const momentTz = require('moment-timezone');

const OhUtils = require('../../utils/bot-utils');
const BotPublicError = require('../../utils/bot-public-error');

const DiscordCommand = require('../discord-command');
const GetTimezoneSuggestions = require('../suggestions/get-timezone-suggestions');
const CommandArgDef = require('../../command_meta/command-arg-def');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const MaxSimilarTimezones = 10;

const SetTimezoneCommandArgDefs = Object.freeze({
  timezone: new CommandArgDef('timezone', {
    aliasIds: [
      'command_settimezone_arg_timezone_alias_timezone',
      'command_settimezone_arg_timezone_alias_t',
      'command_settimezone_arg_timezone_alias_z'
    ],
    helpId: 'command_settimezone_arg_timezone_help',
    suggestions: GetTimezoneSuggestions,
    validationOptions: { nonNull: true }
  })
});

/**
 * Command to set the server-wide timezone for the Discord server.
 * @see DiscordTimeArgScanner.appendTimezone
 * @alias SetTimezoneCommand
 * @extends DiscordCommand
 */
class SetTimezoneCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new SetTimezoneCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_settimezone_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_settimezone_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return SetTimezoneCommandArgDefs;
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
    return langManager.getString('command_settimezone_help');
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
   * @param  {BaseMessage}  message the command's message
   * @return {Promise}              nothing
   */
  async validateFromDiscord(message) {
    await super.validateFromDiscord(message);

    const availableTimezones = momentTz.tz.names();

    if (!availableTimezones.includes(this.timezone)) {
      const proposedTimezones = OhUtils.makeSuggestions(this.timezone, availableTimezones, MaxSimilarTimezones);

      throw new BotPublicError(
        this.langManager.getString('command_settimezone_error_wrong_timezone', proposedTimezones.join(', '))
      );
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
    await this.context.dbManager.setSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.timezone.name,
      this.timezone
    );

    this.context.log.i('SetTimezoneCommand done: new prefix is ' + this.timezone);
    return this.langManager.getString('command_settimezone_success', this.timezone);
  }
}

/**
 * Exports the SetTimezoneCommand class
 * @type {SetTimezoneCommand}
 */
module.exports = SetTimezoneCommand;

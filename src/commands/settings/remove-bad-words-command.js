'use strict';

/**
 * @module remove-bad-words-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Command = require('../command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const ArrayArgScanner = require('../../arg_scanners/array-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const RemoveBadWordsommandArgDefs = Object.freeze({
  words: new CommandArgDef('words', {
    aliasIds: ['command_removebadwords_arg_words_alias_words', 'command_removebadwords_arg_words_alias_w'],
    helpId: 'command_removebadwords_arg_words_help',
    scanner: ArrayArgScanner,
    validationOptions: { isArray: true }
  })
});

/**
 * Command to remove specified words from the list of the bad words on the Discord server.
 * @alias RemoveBadWordsCommand
 * @extends Command
 */
class RemoveBadWordsCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new RemoveBadWordsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_removebadwords_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_removebadwords_displayname';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return RemoveBadWordsommandArgDefs;
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
    return langManager.getString('command_removebadwords_help');
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
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    const currentWordsString = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.badwords.name,
      ''
    );
    const currentWords = currentWordsString.split(ArrayArgScanner.ARRAY_SEPARATOR);

    const wordsToRemove = [];
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i] === undefined || this.words[i] === null || this.words[i].length === 0) {
        continue;
      }

      let found = false;
      for (const currentWord of currentWords) {
        if (currentWord === this.words[i]) {
          found = true;
          break;
        }
      }

      if (found) {
        wordsToRemove.push(this.words[i]);
      }
    }

    if (wordsToRemove.length > 0) {
      const newWordsString = currentWords
        .filter((value, index, array) => {
          return !wordsToRemove.includes(value);
        })
        .join(ArrayArgScanner.ARRAY_SEPARATOR);
      await this.context.dbManager.setSetting(
        this.source,
        this.orgId,
        ServerSettingsTable.SERVER_SETTINGS.badwords.name,
        newWordsString
      );
    }

    this.context.log.i('AddBadWordsCommand done: removed ' + wordsToRemove.length + ' words.');
    return this.langManager.getString('command_removebadwords_success', wordsToRemove.length);
  }
}

/**
 * Exports the RemoveBadWordsCommand class
 * @type {RemoveBadWordsCommand}
 */
module.exports = RemoveBadWordsCommand;

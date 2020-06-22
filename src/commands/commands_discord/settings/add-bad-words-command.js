'use strict';

/**
 * @module add-bad-words-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../../command_meta/command-arg-def');
const ArrayArgScanner = require('../../../arg_scanners/array-arg-scanner');

const DiscordPermissionsManager = require('../../../managers/discord/discord-permissions-manager');

const ServerSettingsTable = require('../../../mongo_classes/server-settings-table');

const AddBadWordsCommandArgDefs = Object.freeze({
  words: new CommandArgDef('words', {
    aliasIds: ['command_addbadwords_arg_words_alias_words', 'command_addbadwords_arg_words_alias_w'],
    helpId: 'command_addbadwords_arg_words_help',
    scanner: ArrayArgScanner,
    validationOptions: { isArray: true }
  })
});

/**
 * Command to add bad words which can be censored later.
 * @alias AddBadWordsCommand
 * @extends DiscordCommand
 */
class AddBadWordsCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new AddBadWordsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_addbadwords_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return AddBadWordsCommandArgDefs;
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
    return langManager.getString('command_addbadwords_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [Discordthis.getPermManager().DISCORD_PERMISSIONS.ADMINISTRATOR];
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {Message}         discordMessage the Discord message as the source of the command
   * @return {Promise<string>}                 the result text to be replied as the response of the execution
   */
  async executeForDiscord(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    const currentWordsString = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.badwords.name,
      ''
    );
    let currentWords = [];
    if (currentWordsString.length > 0) {
      currentWords = currentWordsString.split(ArrayArgScanner.ARRAY_SEPARATOR);
    }

    const wordsToAdd = [];
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

      if (!found) {
        wordsToAdd.push(this.words[i]);
      }
    }

    if (wordsToAdd.length > 0) {
      const newWordsString = currentWords.concat(wordsToAdd).join(ArrayArgScanner.ARRAY_SEPARATOR);
      await this.context.dbManager.setSetting(
        this.source,
        this.orgId,
        ServerSettingsTable.SERVER_SETTINGS.badwords.name,
        newWordsString
      );
    }

    this.context.log.i('AddBadWordsCommand done: added ' + wordsToAdd.length + ' words.');
    return this.langManager.getString('command_addbadwords_success', wordsToAdd.length);
  }
}

/**
 * Exports the AddBadWordsCommand class
 * @type {AddBadWordsCommand}
 */
module.exports = AddBadWordsCommand;

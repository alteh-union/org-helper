'use strict';

/**
 * @module command-handler
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const LangManager = require('../../managers/lang-manager');
const BotTable = require('../../mongo_classes/bot-table');
const ServerSettingsTable = require('../../mongo_classes/server-settings-table');
const UserSettingsTable = require('../../mongo_classes/user-settings-table');

/**
 * Abstract class for handling UI commands. Inheritors should manage commands from specific sources.
 * @alias CommandHandler
 * @abstract
 */
class CommandHandler {
  /**
   * Gets the array of modules which group available UI commands for the Bot, defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedModules() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the array of Bot commands which can be used by UI clients to get suggestions on inpit,
   * defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedSuggestions() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the array of Bot commands which can be used by UI clients to get org-wide suggestions.
   * That is, the suggestons which can be reused by various arguments accross the org without
   * necessity of asking the server every time.
   * @return {Array<constructor>} the defined commands
   */
  get definedOrgWideSuggestions() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the command class by its interface name. Searches only in the defined command modules.
   * If the command is not found in the modules, then returns null.
   * @param  {string}      name the name of command's interface
   * @return {constructor}      the defined command, null if not found
   */
  getCommandByName(name) {
    const modules = this.definedModules;
    for (const commandModule of modules) {
      for (const command of commandModule.commands) {
        if (command.getCommandInterfaceName() === name) {
          return command;
        }
      }
    }
    return null;
  }

  /**
   * Gets the suggestions command class by its interface name.
   * If the command is not found, then returns null.
   * @param  {string}      name the name of command's interface
   * @return {constructor}      the defined suggestions command, null if not found
   */
  getSuggestionsCommandByName(name) {
    for (const suggestionCommand of this.definedSuggestions) {
      if (suggestionCommand.getCommandInterfaceName() === name) {
        return suggestionCommand;
      }
    }
    return null;
  }

  /**
   * Gets the most suitable language manager based on the organization and user preferences.
   * The process is mostly copied from the corresponding process of the standard Bot interface.
   * @see CommandsParser
   * @param  {Context}              context the Bot's context
   * @param  {string}               orgId   the identifier of the organization
   * @param  {string}               userId  the identifier of the user
   * @return {Promise<LangManager>}         the most suitable language manager
   */
  async getCommandLangManager(context, orgId, userId) {
    const currentLocale = await context.dbManager.getSetting(
      BotTable.DISCORD_SOURCE,
      orgId,
      ServerSettingsTable.SERVER_SETTINGS.localeName.name
    );

    const currentUserLocale = await context.dbManager.getUserSetting(
      BotTable.DISCORD_SOURCE,
      orgId,
      userId,
      UserSettingsTable.USER_SETTINGS.localeName.name
    );

    return new LangManager(
      context.localizationPath,
      currentUserLocale === undefined ? currentLocale : currentUserLocale
    );
  };
}

/**
 * Exports the CommandHandler class
 * @type {CommandHandler}
 */
module.exports = CommandHandler;

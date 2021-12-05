'use strict';

/**
 * @module my-data-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const PrivateCommand = require('../private-command');

/**
 * Command to list the data stored on the Bot's backend related to the user.
 * Needed to comply with privacy regulations.
 * @alias MyDataCommand
 * @extends PrivateCommand
 */
class MyDataCommand extends PrivateCommand {
  /**
   * Creates an instance for a user from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForUser(context, source, commandLangManager) {
    return new MyDataCommand(context, source, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_mydata_name';
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
    return langManager.getString('command_mydata_help');
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
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.context.dbManager.getUserData(
      message.source.name,
      message.userId,
      this.commandLangManager
    );
    /* eslint-enable no-return-await */
  }
}

/**
 * Exports the MySettingsCommand class
 * @type {MyDataCommand}
 */
module.exports = MyDataCommand;

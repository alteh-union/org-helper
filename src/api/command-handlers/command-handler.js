'use strict';

/**
 * @module command-handler
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Abstract class for handling web commands. Inheritors should manage commands from specific sources.
 * @alias CommandHandler
 * @abstract
 */
class CommandHandler {
  /**
   * Gets the array of modules which group available web-commands for the Bot, defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedModules() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the command class by its interface name. Searches only in the defined command modules.
   * If the command is not found in the modules, then returns null.
   * @param  {string}  name the name of command's interface
   * @return {Command}      the defined command, null if not found
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
}

/**
 * Exports the CommandHandler class
 * @type {CommandHandler}
 */
module.exports = CommandHandler;

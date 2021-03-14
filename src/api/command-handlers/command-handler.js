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
}

/**
 * Exports the CommandHandler class
 * @type {CommandHandler}
 */
module.exports = CommandHandler;

'use strict';

/**
 * @module command-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Abstract class for managing commands. Inheritors should manage commands from specific sources.
 * @alias CommandManager
 * @abstract
 */
class CommandManager {
  /**
   * Gets the array of public command classes defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedCommands() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * Gets the array of private (direct-messages) command classes defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedPrivateCommands() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }
}

/**
 * Exports the CommandManager class
 * @type {CommandManager}
 */
module.exports = CommandManager;

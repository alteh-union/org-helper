'use strict';

class CommandManager {
  /**
   * Gets the array of defined Discord command classes.
   * @return {Array<constructor>} the defined commands
   */
  get definedCommands() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }

  /**
   * The defined private Discord command classes.
   * @type {Array<constructor>}
   */
  get definedPrivateCommands() {
    throw new Error(`${this.constructor.name} is an abstract class`);
  }
}

module.exports = CommandManager;

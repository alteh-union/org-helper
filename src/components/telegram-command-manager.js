'use strict';

/**
 * @module telegram-command-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const CommandManager = require('./command-manager');

const PingCommand = require('../commands/other/ping-command');

/**
 * Represents commands available for Telegram
 * @alias TelegramCommandManager
 * @extends CommandManager
 */
class TelegramCommandManager extends CommandManager {
  /**
   * Gets the array of public command classes defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedCommands() {
    return Object.freeze([
      PingCommand
    ]);
  }

  /**
   * Gets the array of private (direct-messages) command classes defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedPrivateCommands() {
    return Object.freeze([]);
  }
}

/**
 * Exports the TelegramCommandManager class
 * @type {TelegramCommandManager}
 */
module.exports = TelegramCommandManager;

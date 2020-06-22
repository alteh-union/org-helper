'use strict';

/**
 * @module discord-private-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('./discord-command');

/**
 * Base Discord private command (send by a user to the Bot using the "direct messages" ("DM") feature).
 * @abstract
 * @alias DiscordPrivateCommand
 * @extends DiscordCommand
 */
class DiscordPrivateCommand extends DiscordCommand {
  /**
   * Creates an instance for a user from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForUser(context, source, commandLangManager) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('createForUser: ' + this.name + ' is an abstract class');
  }
}

/**
 * Exports the DiscordPrivateCommand class
 * @type {DiscordPrivateCommand}
 */
module.exports = DiscordPrivateCommand;

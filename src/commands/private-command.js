'use strict';

/**
 * @module discord-private-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Command = require('./command');

/**
 * Base private command (send by a user to the Bot using the "direct messages" ("DM") feature).
 * @abstract
 * @alias PrivateCommand
 * @extends Command
 */
class PrivateCommand extends Command {
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
 * Exports the PrivateCommand class
 * @type {PrivateCommand}
 */
module.exports = PrivateCommand;

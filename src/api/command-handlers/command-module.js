'use strict';

/**
 * @module command-module
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Definition for module containing several commands.
 * @alias CommandModule
 */
class CommandModule {
  /**
   * Constructs an instance of the class
   * @param {string}  name  the name of the argument
   * @param {Object}  info  arguments parameters
   */
  constructor(name, info) {
    this.name = name;

    this.displayName = info.displayName === undefined ? '' : info.displayName;
    this.commands = info.commands === undefined ? [] : info.commands;
    this.icon = info.icon === undefined ? null : info.icon;
  }
}

/**
 * Exports the CommandModule class
 * @type {CommandModule}
 */
module.exports = CommandModule;

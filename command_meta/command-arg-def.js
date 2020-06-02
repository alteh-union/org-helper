'use strict';

/**
 * @module command-arg-def
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const SimpleArgScanner = require('../arg_scanners/simple-arg-scanner');
const ArgValidationTree = require('./arg-validation-tree');

/**
 * Definition for a command's argument.
 * @see Command.getDefinedArgs
 * @alias CommandArgDef
 */
class CommandArgDef {
  /**
   * Constructs an instance of the class
   * @param {string}  name  the name of the argument
   * @param {Object}  info  arguments parameters
   */
  constructor(name, info) {
    this.name = name;

    this.aliasIds = info.aliasIds === undefined ? [] : info.aliasIds;
    this.helpId = info.helpId === undefined ? '' : info.helpId;
    this.skipInSequentialRead = info.skipInSequentialRead === undefined ? false : info.skipInSequentialRead;
    this.scanner = info.scanner === undefined ? SimpleArgScanner : info.scanner;
    this.validationOptions = info.validationOptions === undefined ? {} : info.validationOptions;

    // For validation options implying some other validations - set up that implied options too.
    ArgValidationTree.autoCompleteValidationOptions(this);
  }
}

/**
 * Exports the CommandArgDef class
 * @type {CommandArgDef}
 */
module.exports = CommandArgDef;

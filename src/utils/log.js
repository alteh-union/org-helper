'use strict';

/**
 * @module log
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const fs = require('fs');
const util = require('util');

/**
 * The predefined set of log levels, sorted by severity, descending. "Silent" means logs should provide no output.
 * @type {Object}
 */
const LogLevels = Object.freeze({
  silent: 0,
  fatal: 1,
  error: 2,
  warning: 3,
  info: 4,
  debug: 5,
  verbose: 6
});

/**
 * Logs messages to the console and to the logs file depending on the severity of the message.
 * @alias Log
 */
class Log {
  /**
   * Constructs an instance of the class
   * @param {number} consoleLevel the level up to which logs will be written to the system's console
   * @param {number} fileLevel    the level up to which logs will be written to the output file
   * @param {string} filePath     the path to the output log file
   */
  constructor(consoleLevel, fileLevel, filePath) {
    this.consoleLevel = consoleLevel;
    this.fileLevel = fileLevel;
    this.filePath = filePath;
    this.logFile = fs.createWriteStream(filePath, { flags: 'a' });
  }

  /**
   * Logs the given message to the console output and the output file. Will be skipped if does not have enough
   * severity level.
   * @param  {string} text  the messagess to be logged
   * @param  {number} level the severity level of the message
   */
  log(text, level) {
    if (level === undefined) {
      level = LogLevels.info;
    }

    const date = new Date();

    if (level <= this.consoleLevel) {
      console.log(date.toString() + ' ' + util.format(text));
    }

    if (level <= this.fileLevel) {
      this.logFile.write(date.toString() + ' ' + util.format(text) + '\n');
    }
  }

  /**
   * Logs the message with verbose level. Alias to "verbose".
   * @see Log#verbose
   * @param  {string} text the message
   */
  v(text) {
    this.verbose(text);
  }

  /**
   * Logs the message with verbose level.
   * @see Log#v
   * @param  {string} text the message
   */
  verbose(text) {
    this.log(text, LogLevels.verbose);
  }

  /**
   * Logs the message with debug level. Alias to "debug".
   * @see Log#debug
   * @param  {string} text the message
   */
  d(text) {
    this.debug(text);
  }

  /**
   * Logs the message with debug level.
   * @see Log#d
   * @param  {string} text the message
   */
  debug(text) {
    this.log(text, LogLevels.debug);
  }

  /**
   * Logs the message with info level. Alias to "info".
   * @see Log#info
   * @param  {string} text the message
   */
  i(text) {
    this.info(text);
  }

  /**
   * Logs the message with info level.
   * @see Log#i
   * @param  {string} text the message
   */
  info(text) {
    this.log(text, LogLevels.info);
  }

  /**
   * Logs the message with warning level. Alias to "warning".
   * @see Log#warning
   * @param  {string} text the message
   */
  w(text) {
    this.warning(text);
  }

  /**
   * Logs the message with warning level.
   * @see Log#w
   * @param  {string} text the message
   */
  warning(text) {
    this.log(text, LogLevels.warning);
  }

  /**
   * Logs the message with error level. Alias to "error".
   * @see Log#error
   * @param  {string} text the message
   */
  e(text) {
    this.error(text);
  }

  /**
   * Logs the message with error level.
   * @see Log#e
   * @param  {string} text the message
   */
  error(text) {
    this.log(text, LogLevels.error);
  }

  /**
   * Logs the message with fatal level. Alias to "fatal".
   * @see Log#fatal
   * @param  {string} text the message
   */
  f(text) {
    this.fatal(text);
  }

  /**
   * Logs the message with fatal level.
   * @see Log#f
   * @param  {string} text the message
   */
  fatal(text) {
    this.log(text, LogLevels.fatal);
  }
}

/**
 * Exports the Log class
 * @type {Log}
 */
module.exports = Log;

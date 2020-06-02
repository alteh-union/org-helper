'use strict';

/**
 * @module context
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const DbManager = require('./db-manager');
const LangManager = require('./lang-manager');
const PermissionsManager = require('./permissions-manager');
const CommandsParser = require('./commands-parser');
const MessageModerator = require('./message-moderator');
const Scheduler = require('./scheduler');
const Log = require('../utils/log');

/**
 * Contains global managers of the bot.
 * @alias Context
 */
class Context {
  /**
   * Constructs an instance of the class. Initializes all necessarty managers (besides the PrefsManager,
   * which should be created before the Context).
   * @param {PrefsManager} prefsManager     preferences manager
   * @param {string}       localizationPath the path to localization resources
   * @param {Client}       discordClient    the Discord client
   */
  constructor(prefsManager, localizationPath, discordClient) {
    this.prefsManager = prefsManager;
    this.log = new Log(prefsManager.log_console_verbosity_level, prefsManager.log_file_verbosity_level,
      prefsManager.log_file_path);
    this.localizationPath = localizationPath;
    this.langManager = new LangManager(localizationPath);
    this.dbManager = new DbManager(this);
    this.permManager = new PermissionsManager(this);
    this.commandsParser = new CommandsParser(this);
    this.messageModerator = new MessageModerator(this);
    this.scheduler = new Scheduler(this);

    this.discordClient = discordClient;
    this.discordClientReady = false;

    this.langManager.printMissingTranslations(this.log);
  }
}

/**
 * Exports the Context class
 * @type {Context}
 */
module.exports = Context;

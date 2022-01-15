'use strict';

/**
 * @module context
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DbManager = require('./db-manager');
const LangManager = require('./lang-manager');
const PermissionsManager = require('./permissions-manager');
const CommandsParser = require('./commands-parser');
const MessageModerator = require('./message-moderator');
const Scheduler = require('./scheduler');
const Log = require('../utils/log');
const ImageGenerator = require('./image-generator');
const Welcomer = require('./welcomer');

const CurrentVersion = '1.2';

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
   * @param {string}       projectRoot      the path to the root directory of the Bot's project
   * @param {Client}       discordClient    the Discord client
   * @param {Telegraf}     telegramClient   the Telegram client (presented by a Telegraf instance)
   */
  constructor(prefsManager, localizationPath, projectRoot, discordClient, telegramClient) {
    this.prefsManager = prefsManager;
    this.log = new Log(
      prefsManager.log_console_verbosity_level,
      prefsManager.log_file_verbosity_level,
      prefsManager.log_file_path
    );
    this.localizationPath = localizationPath;
    this.langManager = new LangManager(localizationPath);
    this.dbManager = new DbManager(this);
    this.permManager = new PermissionsManager(this);
    this.commandsParser = new CommandsParser(this);
    this.messageModerator = new MessageModerator(this);
    this.scheduler = new Scheduler(this);
    this.imageGenerator = new ImageGenerator(this);
    this.welcomer = new Welcomer(this);

    this.projectRoot = projectRoot;

    this.discordClient = discordClient;
    this.discordClientReady = false;

    this.telegramClient = telegramClient;

    this.langManager.printMissingTranslations(this.log);
  }

  /**
   * Gets the current public release version of the bot.
   * @todo make setting this version a part of ci
   * @type {number}
   */
  static get CURRENT_VERSION() {
    return CurrentVersion;
  }
}

/**
 * Exports the Context class
 * @type {Context}
 */
module.exports = Context;

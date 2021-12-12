'use strict';

/**
 * @module telegram-command-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const CommandManager = require('./command-manager');

const AddImageTemplateCommand = require('../commands/image/add-image-template-command');
const DeleteImageTemplateCommand = require('../commands/image/delete-image-template-command');
const ListImageTemplatesCommand = require('../commands/image/list-image-templates-command');
const MakeImageCommand = require('../commands/image/make-image-command');
const PingCommand = require('../commands/other/ping-command');
const HelpCommand = require('../commands/other/help-command');
const MySettingsCommand = require('../commands/settings/my-settings-command');
const SetLocaleCommand = require('../commands/settings/set-locale-command');
const SetMyLocaleCommand = require('../commands/settings/set-my-locale-command');
const SetMyTimezoneCommand = require('../commands/settings/set-my-timezone-command');
const SetPrefixCommand = require('../commands/settings/set-prefix-command');
const SetTimezoneCommand = require('../commands/settings/set-timezone-command');
const SettingsCommand = require('../commands/settings/settings-command');

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
      AddImageTemplateCommand,
      DeleteImageTemplateCommand,
      ListImageTemplatesCommand,
      MakeImageCommand,
      PingCommand,
      HelpCommand,
      MySettingsCommand,
      SetLocaleCommand,
      SetMyLocaleCommand,
      SetMyTimezoneCommand,
      SetPrefixCommand,
      SetTimezoneCommand,
      SettingsCommand
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

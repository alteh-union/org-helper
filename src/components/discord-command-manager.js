'use strict';

/**
 * @module discord-command-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const CommandManager = require('./command-manager');

const AddBadWordsCommand = require('../commands/settings/add-bad-words-command');
const AddRoleCommand = require('../commands/moderation/add-role-command');
const AddRoleManagerCommand = require('../commands/permissions/add-role-manager-command');
const BadWordsCommand = require('../commands/settings/bad-words-command');
const BanCommand = require('../commands/moderation/ban-command');
const CleanCommand = require('../commands/moderation/clean-command');
const DeleteImageTemplateCommand = require('../commands/image/delete-image-template-command');
const DeleteReminderCommand = require('../commands/social/delete-reminder-command');
const DeletePermissionCommand = require('../commands/permissions/delete-permission-command');
const DeleteWarningCommand = require('../commands/moderation/delete-warning-command');
const DenyImageTemplateCommand = require('../commands/permissions/deny-image-template-command');
const DenyRemindCommand = require('../commands/permissions/deny-remind-command');
const HelpCommand = require('../commands/other/help-command');
const KickCommand = require('../commands/moderation/kick-command');
const MyPermissionsCommand = require('../commands/permissions/my-permissions-command');
const MySettingsCommand = require('../commands/settings/my-settings-command');
const PermissionsCommand = require('../commands/permissions/permissions-command');
const PermitImageTemplateCommand = require('../commands/permissions/permit-image-template-command');
const PermitRemindCommand = require('../commands/permissions/permit-remind-command');
const PingCommand = require('../commands/other/ping-command');
const MakeImageCommand = require('../commands/image/make-image-command');
const ListImageTemplatesCommand = require('../commands/image/list-image-templates-command');
const AddImageTemplateCommand = require('../commands/image/add-image-template-command');
const PollCommand = require('../commands/social/poll-command');
const RemindCommand = require('../commands/social/remind-command');
const RemindersCommand = require('../commands/social/reminders-command');
const RemoveBadWordsCommand = require('../commands/settings/remove-bad-words-command');
const RemoveRoleCommand = require('../commands/moderation/remove-role-command');
const RemoveRoleManagerCommand = require('../commands/permissions/remove-role-manager-command');
const SetBanOnWarningsCommand = require('../commands/settings/set-ban-on-warnings-command');
const SetCensoringCommand = require('../commands/settings/set-censoring-command');
const SetLocaleCommand = require('../commands/settings/set-locale-command');
const SetModerLogsChannelCommand = require('../commands/settings/set-moder-logs-channel-command');
const SetModerLogsCommand = require('../commands/settings/set-moder-logs-command');
const SetMyLocaleCommand = require('../commands/settings/set-my-locale-command');
const SetMyTimezoneCommand = require('../commands/settings/set-my-timezone-command');
const SetPrefixCommand = require('../commands/settings/set-prefix-command');
const SetTimezoneCommand = require('../commands/settings/set-timezone-command');
const SettingsCommand = require('../commands/settings/settings-command');
const WarnCommand = require('../commands/moderation/warn-command');
const WarningsCommand = require('../commands/moderation/warnings-command');

const MyDataCommand = require('../commands/private_privacy/my-data-command');

/**
 * Represents commands available for Discord
 * @alias DiscordCommandManager
 * @extends CommandManager
 */
class DiscordCommandManager extends CommandManager {
  /**
   * Gets the array of public command classes defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedCommands() {
    return Object.freeze([
      MakeImageCommand,
      ListImageTemplatesCommand,
      AddImageTemplateCommand,
      AddBadWordsCommand,
      AddRoleCommand,
      AddRoleManagerCommand,
      BadWordsCommand,
      BanCommand,
      CleanCommand,
      DeleteImageTemplateCommand,
      DeleteReminderCommand,
      DeletePermissionCommand,
      DeleteWarningCommand,
      DenyImageTemplateCommand,
      DenyRemindCommand,
      HelpCommand,
      KickCommand,
      MyPermissionsCommand,
      MySettingsCommand,
      PermissionsCommand,
      PermitImageTemplateCommand,
      PermitRemindCommand,
      PingCommand,
      PollCommand,
      RemindersCommand,
      RemindCommand,
      RemoveBadWordsCommand,
      RemoveRoleCommand,
      RemoveRoleManagerCommand,
      SetBanOnWarningsCommand,
      SetCensoringCommand,
      SetLocaleCommand,
      SetModerLogsChannelCommand,
      SetModerLogsCommand,
      SetMyLocaleCommand,
      SetMyTimezoneCommand,
      SetPrefixCommand,
      SetTimezoneCommand,
      SettingsCommand,
      WarnCommand,
      WarningsCommand
    ]);
  }

  /**
   * Gets the array of private (direct-messages) command classes defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedPrivateCommands() {
    return Object.freeze([MyDataCommand]);
  }
}

/**
 * Exports the DiscordCommandManager class
 * @type {DiscordCommandManager}
 */
module.exports = DiscordCommandManager;

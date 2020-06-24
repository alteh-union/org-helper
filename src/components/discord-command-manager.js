'use strict';
const CommandManager = require('./command-manager');

const AddBadWordsCommand = require('../commands_discord/settings/add-bad-words-command');
const AddRoleCommand = require('../commands_discord/moderation/add-role-command');
const AddRoleManagerCommand = require('../commands_discord/permissions/add-role-manager-command');
const BadWordsCommand = require('../commands_discord/settings/bad-words-command');
const CleanCommand = require('../commands_discord/moderation/clean-command');
const DeleteReminderCommand = require('../commands_discord/social/delete-reminder-command');
const DenyRemindCommand = require('../commands_discord/permissions/deny-remind-command');
const HelpCommand = require('../commands_discord/other/help-command');
const MyPermissionsCommand = require('../commands_discord/permissions/my-permissions-command');
const MySettingsCommand = require('../commands_discord/settings/my-settings-command');
const PermissionsCommand = require('../commands_discord/permissions/permissions-command');
const PermitRemindCommand = require('../commands_discord/permissions/permit-remind-command');
const PingCommand = require('../commands_discord/other/ping-command');
const PollCommand = require('../commands_discord/social/poll-command');
const RemindCommand = require('../commands_discord/social/remind-command');
const RemindersCommand = require('../commands_discord/social/reminders-command');
const RemoveBadWordsCommand = require('../commands_discord/settings/remove-bad-words-command');
const RemoveRoleCommand = require('../commands_discord/moderation/remove-role-command');
const RemoveRoleManagerCommand = require('../commands_discord/permissions/remove-role-manager-command');
const SetCensoringCommand = require('../commands_discord/settings/set-censoring-command');
const SetLocaleCommand = require('../commands_discord/settings/set-locale-command');
const SetMyLocaleCommand = require('../commands_discord/settings/set-my-locale-command');
const SetMyTimezoneCommand = require('../commands_discord/settings/set-my-timezone-command');
const SetPrefixCommand = require('../commands_discord/settings/set-prefix-command');
const SetTimezoneCommand = require('../commands_discord/settings/set-timezone-command');
const SettingsCommand = require('../commands_discord/settings/settings-command');

const MyDataCommand = require('../commands_discord/private_privacy/my-data-command');

class DiscordCommandManager extends CommandManager {

  /**
   * Gets the array of defined Discord command classes.
   * @return {Array<constructor>} the defined commands
   */
  get definedCommands() {
    return Object.freeze([
      AddBadWordsCommand,
      AddRoleCommand,
      AddRoleManagerCommand,
      BadWordsCommand,
      CleanCommand,
      DeleteReminderCommand,
      DenyRemindCommand,
      HelpCommand,
      MyPermissionsCommand,
      MySettingsCommand,
      PermissionsCommand,
      PermitRemindCommand,
      PingCommand,
      PollCommand,
      RemindersCommand,
      RemindCommand,
      RemoveBadWordsCommand,
      RemoveRoleCommand,
      RemoveRoleManagerCommand,
      SetCensoringCommand,
      SetLocaleCommand,
      SetMyLocaleCommand,
      SetMyTimezoneCommand,
      SetPrefixCommand,
      SetTimezoneCommand,
      SettingsCommand
    ]);
  }

  /**
   * The defined private Discord command classes.
   * @type {Array<constructor>}
   */
  get definedPrivateCommands() {
    return Object.freeze([MyDataCommand]);
  }
}

module.exports = DiscordCommandManager;

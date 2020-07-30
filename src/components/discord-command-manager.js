'use strict';
const CommandManager = require('./command-manager');

const AddBadWordsCommand = require('../commands_discord/settings/add-bad-words-command');
const AddRoleCommand = require('../commands_discord/moderation/add-role-command');
const AddRoleManagerCommand = require('../commands_discord/permissions/add-role-manager-command');
const BadWordsCommand = require('../commands_discord/settings/bad-words-command');
const BanCommand = require('../commands_discord/moderation/ban-command');
const CleanCommand = require('../commands_discord/moderation/clean-command');
const DeleteImageTemplateCommand = require('../commands_discord/image/delete-image-template-command');
const DeleteReminderCommand = require('../commands_discord/social/delete-reminder-command');
const DeletePermissionCommand = require('../commands_discord/permissions/delete-permission-command');
const DeleteWarningCommand = require('../commands_discord/moderation/delete-warning-command');
const DenyImageTemplateCommand = require('../commands_discord/permissions/deny-image-template-command');
const DenyRemindCommand = require('../commands_discord/permissions/deny-remind-command');
const HelpCommand = require('../commands_discord/other/help-command');
const KickCommand = require('../commands_discord/moderation/kick-command');
const MyPermissionsCommand = require('../commands_discord/permissions/my-permissions-command');
const MySettingsCommand = require('../commands_discord/settings/my-settings-command');
const PermissionsCommand = require('../commands_discord/permissions/permissions-command');
const PermitImageTemplateCommand = require('../commands_discord/permissions/permit-image-template-command');
const PermitRemindCommand = require('../commands_discord/permissions/permit-remind-command');
const PingCommand = require('../commands_discord/other/ping-command');
const MakeImageCommand = require('../commands_discord/image/make-image-command');
const ListImageTemplatesCommand = require('../commands_discord/image/list-image-templates-command');
const AddImageTemplateCommand = require('../commands_discord/image/add-image-template-command');
const PollCommand = require('../commands_discord/social/poll-command');
const RemindCommand = require('../commands_discord/social/remind-command');
const RemindersCommand = require('../commands_discord/social/reminders-command');
const RemoveBadWordsCommand = require('../commands_discord/settings/remove-bad-words-command');
const RemoveRoleCommand = require('../commands_discord/moderation/remove-role-command');
const RemoveRoleManagerCommand = require('../commands_discord/permissions/remove-role-manager-command');
const SetBanOnWarningsCommand = require('../commands_discord/settings/set-ban-on-warnings-command');
const SetCensoringCommand = require('../commands_discord/settings/set-censoring-command');
const SetLocaleCommand = require('../commands_discord/settings/set-locale-command');
const SetModerLogsChannelCommand = require('../commands_discord/settings/set-moder-logs-channel-command');
const SetModerLogsCommand = require('../commands_discord/settings/set-moder-logs-command');
const SetMyLocaleCommand = require('../commands_discord/settings/set-my-locale-command');
const SetMyTimezoneCommand = require('../commands_discord/settings/set-my-timezone-command');
const SetPrefixCommand = require('../commands_discord/settings/set-prefix-command');
const SetTimezoneCommand = require('../commands_discord/settings/set-timezone-command');
const SettingsCommand = require('../commands_discord/settings/settings-command');
const WarnCommand = require('../commands_discord/moderation/warn-command');
const WarningsCommand = require('../commands_discord/moderation/warnings-command');

const MyDataCommand = require('../commands_discord/private_privacy/my-data-command');

/**
 * Class represents command available for the Discord
 */
class DiscordCommandManager extends CommandManager {
  /**
   * Gets the array of defined Discord command classes.
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
   * The defined private Discord command classes.
   * @type {Array<constructor>}
   */
  get definedPrivateCommands() {
    return Object.freeze([MyDataCommand]);
  }
}

module.exports = DiscordCommandManager;

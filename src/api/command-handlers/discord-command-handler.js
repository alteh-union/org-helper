'use strict';

/**
 * @module discord-command-handler
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const CommandHandler = require('./command-handler');
const CommandModule = require('./command-module');

const AddBadWordsCommand = require('../../commands/settings/add-bad-words-command');
const AddRoleCommand = require('../../commands/moderation/add-role-command');
const AddRoleManagerCommand = require('../../commands/permissions/add-role-manager-command');
const BadWordsCommand = require('../../commands/settings/bad-words-command');
const BanCommand = require('../../commands/moderation/ban-command');
const CleanCommand = require('../../commands/moderation/clean-command');
const DeleteImageTemplateCommand = require('../../commands/image/delete-image-template-command');
const DeleteReminderCommand = require('../../commands/social/delete-reminder-command');
const DeletePermissionCommand = require('../../commands/permissions/delete-permission-command');
const DeleteWarningCommand = require('../../commands/moderation/delete-warning-command');
const DenyImageTemplateCommand = require('../../commands/permissions/deny-image-template-command');
const DenyRemindCommand = require('../../commands/permissions/deny-remind-command');
const KickCommand = require('../../commands/moderation/kick-command');
const MyPermissionsCommand = require('../../commands/permissions/my-permissions-command');
const MySettingsCommand = require('../../commands/settings/my-settings-command');
const PermissionsCommand = require('../../commands/permissions/permissions-command');
const PermitImageTemplateCommand = require('../../commands/permissions/permit-image-template-command');
const PermitRemindCommand = require('../../commands/permissions/permit-remind-command');
const MakeImageCommand = require('../../commands/image/make-image-command');
const ListImageTemplatesCommand = require('../../commands/image/list-image-templates-command');
const AddImageTemplateCommand = require('../../commands/image/add-image-template-command');
const RemindCommand = require('../../commands/social/remind-command');
const RemindersCommand = require('../../commands/social/reminders-command');
const RemoveBadWordsCommand = require('../../commands/settings/remove-bad-words-command');
const RemoveRoleCommand = require('../../commands/moderation/remove-role-command');
const RemoveRoleManagerCommand = require('../../commands/permissions/remove-role-manager-command');
const SetBanOnWarningsCommand = require('../../commands/settings/set-ban-on-warnings-command');
const SetCensoringCommand = require('../../commands/settings/set-censoring-command');
const SetLocaleCommand = require('../../commands/settings/set-locale-command');
const SetModerLogsChannelCommand = require('../../commands/settings/set-moder-logs-channel-command');
const SetModerLogsCommand = require('../../commands/settings/set-moder-logs-command');
const SetMyLocaleCommand = require('../../commands/settings/set-my-locale-command');
const SetMyTimezoneCommand = require('../../commands/settings/set-my-timezone-command');
const SetPrefixCommand = require('../../commands/settings/set-prefix-command');
const SetTimezoneCommand = require('../../commands/settings/set-timezone-command');
const SettingsCommand = require('../../commands/settings/settings-command');
const WarnCommand = require('../../commands/moderation/warn-command');
const WarningsCommand = require('../../commands/moderation/warnings-command');

const GetChannelSuggestions = require('../../commands/suggestions/get-channel-suggestions');
const GetUserSuggestions = require('../../commands/suggestions/get-user-suggestions');
const GetRoleSuggestions = require('../../commands/suggestions/get-role-suggestions');
const GetSubjectSuggestions = require('../../commands/suggestions/get-subject-suggestions');
const GetMentionSuggestions = require('../../commands/suggestions/get-mention-suggestions');
const GetSettingSuggestions = require('../../commands/suggestions/get-setting-suggestions');
const GetUserSettingSuggestions = require('../../commands/suggestions/get-user-setting-suggestions');
const GetPermissionSuggestions = require('../../commands/suggestions/get-permission-suggestions');
const GetLocaleSuggestions = require('../../commands/suggestions/get-locale-suggestions');
const GetTimezoneSuggestions = require('../../commands/suggestions/get-timezone-suggestions');
const GetReminderSuggestions = require('../../commands/suggestions/get-reminder-suggestions');
const GetWarningSuggestions = require('../../commands/suggestions/get-warning-suggestions');
const GetImageTemplateSuggestions = require('../../commands/suggestions/get-image-template-suggestions');

const Modules = Object.freeze([
  new CommandModule('permissions', {
    displayName: 'web_command_module_permissions',
    commands: [AddRoleManagerCommand, DeletePermissionCommand, DenyImageTemplateCommand, DenyRemindCommand,
      MyPermissionsCommand, PermissionsCommand, PermitImageTemplateCommand, PermitRemindCommand,
      RemoveRoleManagerCommand],
    icon: null
  }),
  new CommandModule('moderation', {
    displayName: 'web_command_module_moderation',
    commands: [AddRoleCommand, BanCommand, CleanCommand, DeleteWarningCommand,
      KickCommand, RemoveRoleCommand, WarnCommand, WarningsCommand],
    icon: null
  }),
  new CommandModule('social', {
    displayName: 'web_command_module_social',
    commands: [DeleteReminderCommand, RemindCommand, RemindersCommand],
    icon: null
  }),
  new CommandModule('settings', {
    displayName: 'web_command_module_settings',
    commands: [SettingsCommand, AddBadWordsCommand, BadWordsCommand, RemoveBadWordsCommand, SetBanOnWarningsCommand,
      SetCensoringCommand, SetLocaleCommand, SetModerLogsChannelCommand,
      SetModerLogsCommand, SetPrefixCommand, SetTimezoneCommand],
    icon: null
  }),
  new CommandModule('my_settings', {
    displayName: 'web_command_module_mysettings',
    commands: [MySettingsCommand, SetMyLocaleCommand, SetMyTimezoneCommand],
    icon: null
  }),
  new CommandModule('images', {
    displayName: 'web_command_module_images',
    commands: [MakeImageCommand, ListImageTemplatesCommand, AddImageTemplateCommand, DeleteImageTemplateCommand],
    icon: null
  }),
]);

const SuggestionCommands = Object.freeze([GetChannelSuggestions, GetUserSuggestions, GetRoleSuggestions,
  GetSubjectSuggestions, GetMentionSuggestions, GetSettingSuggestions, GetUserSettingSuggestions,
  GetPermissionSuggestions, GetLocaleSuggestions, GetTimezoneSuggestions, GetReminderSuggestions, GetWarningSuggestions,
  GetImageTemplateSuggestions]);

const OrgWideSuggestionCommands = Object.freeze([GetChannelSuggestions, GetUserSuggestions, GetRoleSuggestions,
  GetSubjectSuggestions, GetMentionSuggestions, GetSettingSuggestions, GetUserSettingSuggestions,
  GetPermissionSuggestions, GetLocaleSuggestions, GetTimezoneSuggestions]);

/**
 * Handles UI commands for the Discord client.
 * @alias DiscordCommandHandler
 * @extends CommandHandler
 * @abstract
 */
class DiscordCommandHandler extends CommandHandler {
  /**
   * Gets the array of modules which group available UI commands for the Bot, defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedModules() {
    return Modules;
  }

  /**
   * Gets the array of Bot commands which can be used by UI clients to get suggestions on inpit,
   * defined for specific source.
   * @return {Array<constructor>} the defined commands
   */
  get definedSuggestions() {
    return SuggestionCommands;
  }

  /**
   * Gets the array of Bot commands which can be used by UI clients to get org-wide suggestions.
   * That is, the suggestons which can be reused by various arguments across the org without
   * necessity of asking the server every time.
   * @return {Array<constructor>} the defined commands
   */
  get definedOrgWideSuggestions() {
    return OrgWideSuggestionCommands;
  }
}

/**
 * Exports the DiscordCommandHandler class
 * @type {DiscordCommandHandler}
 */
module.exports = DiscordCommandHandler;

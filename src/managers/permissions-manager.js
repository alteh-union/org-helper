'use strict';

/**
 * @module permissions-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../utils/bot-utils');

const MultiLangValue = require('../utils/multi-lang-value');
const BotPublicError = require('../utils/bot-public-error');

const DiscordChannelsArg = require('../command_meta/discord-channels-arg');
const DiscordSubjectsArg = require('../command_meta/discord-subjects-arg');

const BotTable = require('../mongo_classes/bot-table');

const DefinedPermissions = Object.freeze({
  remind: new MultiLangValue('remind', 'permission_type_remind'),
  role: new MultiLangValue('role', 'permission_type_role')
});

const DefinedFilters = Object.freeze({
  channelId: new MultiLangValue('channelId', 'permission_filter_channelId'),
  roleId: new MultiLangValue('roleId', 'permission_filter_roleId')
});

const SubjectTypes = Object.freeze({
  user: new MultiLangValue('user', 'permission_subject_user'),
  role: new MultiLangValue('role', 'permission_subject_role')
});

const DiscordPermissions = Object.freeze({
  ADMINISTRATOR: 'ADMINISTRATOR',
  CREATE_INSTANT_INVITE: 'CREATE_INSTANT_INVITE',
  KICK_MEMBERS: 'KICK_MEMBERS',
  BAN_MEMBERS: 'BAN_MEMBERS',
  MANAGE_CHANNELS: 'MANAGE_CHANNELS',
  MANAGE_GUILD: 'MANAGE_GUILD',
  ADD_REACTIONS: 'ADD_REACTIONS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
  PRIORITY_SPEAKER: 'PRIORITY_SPEAKER',
  STREAM: 'STREAM',
  VIEW_CHANNEL: 'VIEW_CHANNEL',
  SEND_MESSAGES: 'SEND_MESSAGES',
  SEND_TTS_MESSAGES: 'SEND_TTS_MESSAGES',
  MANAGE_MESSAGES: 'MANAGE_MESSAGES',
  EMBED_LINKS: 'EMBED_LINKS',
  ATTACH_FILES: 'ATTACH_FILES',
  READ_MESSAGE_HISTORY: 'READ_MESSAGE_HISTORY',
  MENTION_EVERYONE: 'MENTION_EVERYONE',
  USE_EXTERNAL_EMOJIS: 'USE_EXTERNAL_EMOJIS',
  VIEW_GUILD_INSIGHTS: 'VIEW_GUILD_INSIGHTS',
  CONNECT: 'CONNECT',
  SPEAK: 'SPEAK',
  MUTE_MEMBERS: 'MUTE_MEMBERS',
  DEAFEN_MEMBERS: 'DEAFEN_MEMBERS',
  MOVE_MEMBERS: 'MOVE_MEMBERS',
  USE_VAD: 'USE_VAD',
  CHANGE_NICKNAME: 'CHANGE_NICKNAME',
  MANAGE_NICKNAMES: 'MANAGE_NICKNAMES',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_WEBHOOKS: 'MANAGE_WEBHOOKS',
  MANAGE_EMOJIS: 'MANAGE_EMOJIS'
});

/**
 * Manages and check caller's permissions for commands.
 * @alias PermissionsManager
 */
class PermissionsManager {
  /**
   * Constructs an instance of the class
   * @param {Context} context the Cot's context
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * The object containing defined permission types as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get DEFINED_PERMISSIONS() {
    return DefinedPermissions;
  }

  /**
   * The object containing defined filter types as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get DEFINED_FILTERS() {
    return DefinedFilters;
  }

  /**
   * The object containing defined Discord permissions (keep intact with Discord API).
   * @type {Object}
   */
  static get DISCORD_PERMISSIONS() {
    return DiscordPermissions;
  }

  /**
   * The object containing defined permission types as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get SUBJECT_TYPES() {
    return SubjectTypes;
  }

  /**
   * The object containing defined filter types for Discord channels as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get DISCORD_CHANNELS_FILTERS() {
    return [DefinedFilters.channelId];
  }

  /**
   * The object containing defined filter types for Discord users as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get DISCORD_MEMBERS_FILTERS() {
    return [];
  }

  /**
   * The object containing defined filter types for Discord roles as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get DISCORD_ROLES_FILTERS() {
    return [DefinedFilters.roleId];
  }

  /**
   * Check permissions of the user defined via the Bot.
   * Takes all defined permission filters, for each of them checks if corresponding arg's value
   * match at least one record in the permissions table.
   * If false, then throws an error.
   * @see CommandPermissionFilter
   * @throws {BotPublicError}
   * @param  {string}         commandUserId Id of the user who launces the command
   * @param  {Array<string>}  roleIds       Array of role ids assigned to the user
   * @param  {Command}        command       Command object
   * @param  {string}         source        Name of the command's source (Discord etc.)
   * @return {Promise}                      Empty. Will throw exception if permissions are violated
   */
  async checkBotPermissions(commandUserId, roleIds, command, source) {
    const permissionFilters = command.constructor.getRequiredBotPermissions();

    const permissionResults = [];
    for (const permissionFilter of permissionFilters) {
      const andArray = [];

      andArray.push({ source });
      andArray.push({ orgId: command.orgId });

      const userIdQuery = { $and: [{ subjectType: SubjectTypes.user.name }, { subjectId: commandUserId }] };

      const userRolesArrayQuery = [];
      for (const roleId of roleIds) {
        userRolesArrayQuery.push({ subjectId: roleId });
      }

      const userRolesQuery = { $and: [{ subjectType: SubjectTypes.role.name }, { $or: userRolesArrayQuery }] };

      const idQuery = { $or: [userIdQuery, userRolesQuery] };
      andArray.push(idQuery);

      andArray.push({ permissionType: permissionFilter.permissionName });

      const filtersArrayQuery = [];
      const filtersFields = permissionFilter.filterFields;
      for (const filtersField of filtersFields) {
        const anyValueObject = {};
        anyValueObject['filter.' + filtersField.filterFieldName] = OhUtils.ANY_VALUE;
        const orFilterArray = [anyValueObject];

        if (command[filtersField.argName] instanceof DiscordChannelsArg) {
          const channelsFilter = command[filtersField.argName].channels;
          for (const channel of channelsFilter) {
            const particularValueObject = {};
            particularValueObject['filter.' + filtersField.filterFieldName] = channel;
            orFilterArray.push(particularValueObject);
          }
        } else if (command[filtersField.argName] instanceof DiscordSubjectsArg) {
          const subjectIdsFilter = command[filtersField.argName].subjectIds;
          for (const subjectId of subjectIdsFilter) {
            const particularValueObject = {};
            particularValueObject['filter.' + filtersField.filterFieldName] = subjectId;
            orFilterArray.push(particularValueObject);
          }

          const subjectRolesFilter = command[filtersField.argName].subjectRoles;
          for (const subjectRole of subjectRolesFilter) {
            const particularValueObject = {};
            particularValueObject['filter.' + filtersField.filterFieldName] = subjectRole;
            orFilterArray.push(particularValueObject);
          }
        } else {
          const particularValueObject = {};
          particularValueObject['filter.' + filtersField.filterFieldName] = command[filtersField.argName];
          orFilterArray.push(particularValueObject);
        }

        filtersArrayQuery.push({ $or: orFilterArray });
      }

      andArray.push({ $and: filtersArrayQuery });

      const query = { $and: andArray };

      permissionResults.push(
        this.context.dbManager.getRows(this.context.dbManager.permissionsTable, query).then(permissions => {
          for (const permissionFilter of permissionFilters) {
            if (permissions === null || permissions.length === 0) {
              this.context.log.f('Required permissions not found for: ' + permissionFilter.permissionName);
              throw new BotPublicError(
                command.langManager.getString(
                  'permission_missing_bot',
                  command.langManager.getString(DefinedPermissions[permissionFilter.permissionName].textId)
                )
              );
            }

            const filtersFields = permissionFilter.filterFields;

            for (const filterField of filtersFields) {
              if (command[filterField.argName] instanceof DiscordChannelsArg) {
                this.checkDiscordEntityFilter(
                  permissionFilter.permissionName,
                  filterField.filterFieldName,
                  permissions,
                  command[filterField.argName].channels,
                  command.langManager
                );
              } else if (command[filterField.argName] instanceof DiscordSubjectsArg) {
                this.checkDiscordEntityFilter(
                  permissionFilter.permissionName,
                  filterField.filterFieldName,
                  permissions,
                  command[filterField.argName].subjectIds,
                  command.langManager
                );
                this.checkDiscordEntityFilter(
                  permissionFilter.permissionName,
                  filterField.filterFieldName,
                  permissions,
                  command[filterField.argName].subjectRoles,
                  command.langManager
                );
              }
            }
          }
        })
      );
    }

    await Promise.all(permissionResults);
  }

  /**
   * Checks that existing permission rows match each of the given Discord entity.
   * If the permission's filter is defined as "any", then it matches any entity.
   * Throws error if not all entities are matched.
   * @throws {BotPublicError}
   * @param  {string}               permissionName  the permission name
   * @param  {string}               filterFieldName the name of the filter field
   * @param  {Array<OrgPermission>} permissionRows  the permission rows from DB
   * @param  {Array<Object>}        entitiesFilter  the array of entities to check against the permissions
   * @param  {LangManager}          langManager     the language manager to set up the public error text
   */
  checkDiscordEntityFilter(permissionName, filterFieldName, permissionRows, entitiesFilter, langManager) {
    for (const entityFilter of entitiesFilter) {
      let found = false;
      for (const permissionRow of permissionRows) {
        const filterValue = permissionRow.filter[filterFieldName];
        if (filterValue === entityFilter || filterValue === OhUtils.ANY_VALUE) {
          found = true;
          break;
        }
      }

      if (!found) {
        this.context.log.f('Required permissions not found for a particular entity: ' + entityFilter);
        throw new BotPublicError(
          langManager.getString(
            'permission_missing_bot',
            langManager.getString(DefinedPermissions[permissionName].textId)
          )
        );
      }
    }
  }

  /**
   * Checks if the author of the Discord message has necessary permissions in the channel.
   * Throws public error if the permissions are not found.
   * @throws {BotPublicError}
   * @param  {Client}          discordClient  the Discord client
   * @param  {Message}         discordMessage the command's message
   * @param  {DiscordCommand}  command        the command instance
   * @return {Promise}                        nothing
   */
  async checkDiscordPermissions(discordClient, discordMessage, command) {
    const requiredDiscordPermissions = command.constructor.getRequiredDiscordPermissions();

    for (const permission of requiredDiscordPermissions) {
      if (!discordMessage.member.permissionsIn(discordMessage.channel).has(permission)) {
        this.context.log.w(
          'Attempt to use command ' +
            command.constructor.getCommandInterfaceName() +
            ' by user ' +
            discordMessage.member.id
        );
        throw new BotPublicError(command.langManager.getString('permission_missing_discord', permission));
      }
    }
  }

  /**
   * Checks if the author of the Discord message has enough permissions to run the command,
   * both from Discord perpesctive and Bot perspective.
   * Bot's permission requirements can be overriden if the author is admin on the server and
   * the bypass is enabled in Bot's preferences (typically should be "true" for all non-dev Bot's instances).
   * Throws public error if the permissions are not found.
   * @throws {BotPublicError}
   * @param  {Client}          discordClient  the Discord client
   * @param  {Message}         discordMessage the command's message
   * @param  {DiscordCommand}  command        the command instance
   * @return {Promise}                        nothing
   */
  async checkDiscordCommandPermissions(discordClient, discordMessage, command) {
    const rolesArray = discordMessage.member.roles.cache.array();
    const roleIds = [];
    for (const role of rolesArray) {
      roleIds.push(role.id);
    }

    if (
      this.context.prefsManager.bypass_bot_permissions_for_discord_admins !== 'true' ||
      !discordMessage.member.permissionsIn(discordMessage.channel).has(DiscordPermissions.ADMINISTRATOR)
    ) {
      await this.checkBotPermissions(discordMessage.member.id, roleIds, command, BotTable.DISCORD_SOURCE);
    }

    await this.checkDiscordPermissions(discordClient, discordMessage, command);
  }

  /**
   * Checks if the author of the Discord message is admin on the server.
   * @param  {Message}  discordMessage the message
   * @return {Boolean}                 true if admin, false otherwise
   */
  isAuthorAdmin(discordMessage) {
    return discordMessage.member.permissionsIn(discordMessage.channel).has(DiscordPermissions.ADMINISTRATOR);
  }
}

/**
 * Exports the PermissionsManager class
 * @type {PermissionsManager}
 */
module.exports = PermissionsManager;

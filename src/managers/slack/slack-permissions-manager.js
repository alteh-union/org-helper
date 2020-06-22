'use strict';

/**
 * @module permissions-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');

const MultiLangValue = require('../../utils/multi-lang-value');
const BotPublicError = require('../../utils/bot-public-error');

const SlackChannelsArg = require('../../command_meta/discord-channels-arg');
const SlackSubjectsArg = require('../../command_meta/discord-subjects-arg');

const BotTable = require('../../mongo_classes/bot-table');

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

const SlackPermissions = Object.freeze({
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
class SlackPermissionsManager {
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
   * The object containing defined Slack permissions (keep intact with Slack API).
   * @type {Object}
   */
  static get SLACK_PERMISSIONS() {
    return SlackPermissions;
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
   * The object containing defined filter types for Slack channels as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get SLACK_CHANNELS_FILTERS() {
    return [DefinedFilters.channelId];
  }

  /**
   * The object containing defined filter types for Slack users as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get SLACK_MEMBERS_FILTERS() {
    return [];
  }

  /**
   * The object containing defined filter types for Slack roles as multilanguage values.
   * @see MultiLangValue
   * @type {Object}
   */
  static get SLACK_ROLES_FILTERS() {
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
   * @param  {string}         source        Name of the command's source (Slack etc.)
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

        if (command[filtersField.argName] instanceof SlackChannelsArg) {
          const channelsFilter = command[filtersField.argName].channels;
          for (const channel of channelsFilter) {
            const particularValueObject = {};
            particularValueObject['filter.' + filtersField.filterFieldName] = channel;
            orFilterArray.push(particularValueObject);
          }
        } else if (command[filtersField.argName] instanceof SlackSubjectsArg) {
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
              if (command[filterField.argName] instanceof SlackChannelsArg) {
                this.checkSlackEntityFilter(
                  permissionFilter.permissionName,
                  filterField.filterFieldName,
                  permissions,
                  command[filterField.argName].channels,
                  command.langManager
                );
              } else if (command[filterField.argName] instanceof SlackSubjectsArg) {
                this.checkSlackEntityFilter(
                  permissionFilter.permissionName,
                  filterField.filterFieldName,
                  permissions,
                  command[filterField.argName].subjectIds,
                  command.langManager
                );
                this.checkSlackEntityFilter(
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
   * Checks that existing permission rows match each of the given Slack entity.
   * If the permission's filter is defined as "any", then it matches any entity.
   * Throws error if not all entities are matched.
   * @throws {BotPublicError}
   * @param  {string}               permissionName  the permission name
   * @param  {string}               filterFieldName the name of the filter field
   * @param  {Array<OrgPermission>} permissionRows  the permission rows from DB
   * @param  {Array<Object>}        entitiesFilter  the array of entities to check against the permissions
   * @param  {LangManager}          langManager     the language manager to set up the public error text
   */
  checkSlackEntityFilter(permissionName, filterFieldName, permissionRows, entitiesFilter, langManager) {
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
   * Checks if the author of the Slack message has necessary permissions in the channel.
   * Throws public error if the permissions are not found.
   * @throws {BotPublicError}
   * @param  {Client}          slackClient  the Slack client
   * @param  {Message}         slackMessage the command's message
   * @param  {SlackCommand}  command        the command instance
   * @return {Promise}                        nothing
   */
  async checkSlackPermissions(slackClient, slackMessage, command) {
    const requiredSlackPermissions = command.constructor.getRequiredSlackPermissions();

    for (const permission of requiredSlackPermissions) {
      if (!slackMessage.member.permissionsIn(slackMessage.channel).has(permission)) {
        this.context.log.w(
          'Attempt to use command ' +
          command.constructor.getCommandInterfaceName() +
          ' by user ' +
          slackMessage.member.id
        );
        throw new BotPublicError(command.langManager.getString('permission_missing_slack', permission));
      }
    }
  }

  /**
   * Checks if the author of the Slack message has enough permissions to run the command,
   * both from Slack perpesctive and Bot perspective.
   * Bot's permission requirements can be overriden if the author is admin on the server and
   * the bypass is enabled in Bot's preferences (typically should be "true" for all non-dev Bot's instances).
   * Throws public error if the permissions are not found.
   * @throws {BotPublicError}
   * @param  {Client}          slackClient  the Slack client
   * @param  {Message}         slackMessage the command's message
   * @param  {SlackCommand}  command        the command instance
   * @return {Promise}                        nothing
   */
  async checkSlackCommandPermissions(slackClient, slackMessage, command) {
    // TODO: ADD ROLES
  }

  /**
   * Checks if the author of the Slack message is admin on the server.
   * @param  {Message}  slackMessage the message
   * @return {Boolean}                 true if admin, false otherwise
   */
  isAuthorAdmin(slackMessage) {
    return slackMessage.member.permissionsIn(slackMessage.channel).has(SlackPermissions.ADMINISTRATOR);
  }
}

/**
 * Exports the PermissionsManager class
 * @type {SlackPermissionsManager}
 */
module.exports = SlackPermissionsManager;

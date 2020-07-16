'use strict';

/**
 * @module db-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');

const PermissionsManager = require('./permissions-manager');

const BotTable = require('../mongo_classes/bot-table');
const OrgsTable = require('../mongo_classes/orgs-table');
const ChannelsTable = require('../mongo_classes/channels-table');
const MembersTable = require('../mongo_classes/members-table');
const PermissionsTable = require('../mongo_classes/permissions-table');
const RolesTable = require('../mongo_classes/roles-table');
const TasksTable = require('../mongo_classes/tasks-table');
const ServerSettingsTable = require('../mongo_classes/server-settings-table');
const UserSettingsTable = require('../mongo_classes/user-settings-table');
const ImageTemplateTable = require('../mongo_classes/image-template-table');
const WarningsTable = require('../mongo_classes/warnings-table');

const CurrentVersion = 3;

/**
 * The defined tables.
 * @type {Object}
 */
const Tables = Object.freeze({
  orgsTable: OrgsTable,
  channelsTable: ChannelsTable,
  membersTable: MembersTable,
  permissionsTable: PermissionsTable,
  rolesTable: RolesTable,
  tasksTable: TasksTable,
  serverSettingsTable: ServerSettingsTable,
  userSettingsTable: UserSettingsTable,
  imageTemplateTable: ImageTemplateTable,
  warningsTable: WarningsTable
});

/**
 * Manages databases of the Bot.
 * @alias DbManager
 */
class DbManager {
  /**
   * Constructs an instance of the class
   * @param {Context} context the Bot's context
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Gets the current version of database model.
   * @type {number}
   */
  static get CURRENT_VERSION() {
    return CurrentVersion;
  }

  /**
   * Inits the DB manager. Creates all necessary tables, and inits each of them.
   * @return {Promise} nothing
   */
  async init() {
    const tablesKeys = Object.keys(Tables);
    this.tables = [];
    const initResults = [];
    for (const key of tablesKeys) {
      this[key] = new Tables[key](this);
      this.tables.push(this[key]);
      initResults.push(this[key].init());
    }

    await Promise.all(initResults);
  }

  /**
   * Updates the list of Discord guild in DB according to the information fetched from the Client.
   * @param  {Colletion<Guild>} guilds the Discord guilds where the Bot is present
   * @return {Promise}                 nothing
   */
  async updateGuilds(guilds) {
    await this.orgsTable.updateFromDiscord(guilds);
  }

  /**
   * Updates a Discord guild according to the information fetched from the Client.
   * @todo to implement hard linking/hooks between tables, so when some entity gets removed from the guild,
   * related entities in other tables also get removed.
   * @param  {Guild}   guild the Discord guild
   * @return {Promise}       nothing
   */
  async updateGuild(guild) {
    await this.channelsTable.updateFromDiscord(guild.channels.cache, guild);
    await this.membersTable.updateFromDiscord(guild.members.cache, guild);
    await this.rolesTable.updateFromDiscord(guild.roles.cache, guild);
  }

  /**
   * Sets the Mongo DB object and inits the instance.
   * @param  {Object}  dbo the database Object
   * @return {Promise}     nothing
   */
  async setDbo(dbo) {
    this.dbo = dbo;
    await this.init();
  }

  /**
   * Gets the rows of a given table for a given Discord organization, with a query filter, if specified.
   * @param  {BotTable}       table the table
   * @param  {string}         orgId the organization identifier
   * @param  {Object}         query the query filter (may be skipped)
   * @return {Promise<Array>}       the query result with the rows
   */
  async getDiscordRows(table, orgId, query) {
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await table.getCurrentDiscordRows(orgId, query);
    /* eslint-enable no-return-await */
  }

  /**
   * Gets the rows of a given table using a query filter
   * @param  {BotTable}  table the table
   * @param  {Object}    query the query filter object
   * @return {Promise<Array>}  the query result with the rows
   */
  async getRows(table, query) {
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await table.getRows(query);
    /* eslint-enable no-return-await */
  }

  /**
   * Inserts an entity to a given DB table.
   * @param  {BotTable}  table  the table
   * @param  {Object}    entity the entity to be inserted
   * @return {Promise}          nothing
   */
  async insertOne(table, entity) {
    if (entity.orgId === undefined) {
      return false;
    }

    const duplicateQuery = {};
    const keys = Object.keys(entity);
    for (const key of keys) {
      if (!table.getRowClass().getKeyColumns().includes(key)) {
        duplicateQuery[key] = entity[key];
      }
    }

    const duplicateRows = await this.getDiscordRows(table, entity.orgId, duplicateQuery);
    if (duplicateRows !== null && duplicateRows.length > 0) {
      return false;
    }

    this.context.log.v('insertOne: ' + util.inspect(entity, { showHidden: true, depth: 5 }));
    await this.dbo.collection(table.getTableName()).insertOne(entity);

    return true;
  }

  /**
   * Deletes rows of a given Discord organization using a given filter query
   * @param  {BotTable}  table the table
   * @param  {string}    orgId the organization identifier
   * @param  {Object}    query the query filter object
   * @return {Promise}         nothing
   */
  async deleteDiscordRows(table, orgId, query) {
    await table.deleteDiscordRows(orgId, query);
  }

  /**
   * Handles events of deleting organizations.
   * @param  {DbManager}  dbManager the database manager instance
   * @param  {OrgRow}     org       the organization row instance
   * @return {Promise}              nothing
   */
  async onOrgDeleted(dbManager, org) {
    const deleteResults = [];
    for (const table of dbManager.tables) {
      if (Object.values(table.getRowClass().getColumns()).includes('orgId')) {
        deleteResults.push(table.deleteRows(org.source, org.id));
      }
    }
    dbManager.context.log.i(
      'onOrgDeleted: deleted data for org with id ' + org.id + ' name ' + org.name + ' from source ' + org.source
    );

    await Promise.all(deleteResults);
  }

  /**
   * Gets an organization-wide setting.
   * @param  {string}          source       the source name (like Discord etc.)
   * @param  {string}          orgId        the organization identifier
   * @param  {string}          settingName  the setting name
   * @param  {Object}          defaultValue the default value to be returned if the setting is not set
   * @return {Promise<Object>}              the setting value
   */
  async getSetting(source, orgId, settingName, defaultValue) {
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.serverSettingsTable.getSetting(source, orgId, settingName, defaultValue);
    /* eslint-enable no-return-await */
  }

  /**
   * Sets an organization-wide setting.
   * @param  {string}          source       the source name (like Discord etc.)
   * @param  {string}          orgId        the organization identifier
   * @param  {string}          settingName  the setting name
   * @param  {Object}          value        the value to be set
   * @return {Promise}                      nothing
   */
  async setSetting(source, orgId, settingName, value) {
    await this.serverSettingsTable.setSetting(source, orgId, settingName, value);
  }

  /**
   * Removes value from an organization-wide setting
   * @param  {string}  source      the source name (like Discord etc.)
   * @param  {string}  orgId       the organization identifier
   * @param  {string}  settingName the setting name
   * @return {Promise}             nothing
   */
  async removeSetting(source, orgId, settingName) {
    await this.serverSettingsTable.setSetting(source, orgId, settingName);
  }

  /**
   * Gets a setting value for a given user in an organization.
   * @param  {string}           source       the source name (like Discord etc.)
   * @param  {string}           orgId        the organization identifier
   * @param  {string}           userId       the user identifier
   * @param  {string}           settingName  the setting name
   * @param  {Object}           defaultValue the default value to be returned if the setting is not set
   * @return {Promise<Object>}               the setting value
   */
  async getUserSetting(source, orgId, userId, settingName, defaultValue) {
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.userSettingsTable.getSetting(source, orgId, userId, settingName, defaultValue);
    /* eslint-enable no-return-await */
  }

  /**
   * Sets a setting value for a given user in an organization.
   * @param  {string}          source       the source name (like Discord etc.)
   * @param  {string}          orgId        the organization identifier
   * @param  {string}          userId       the user identifier
   * @param  {string}          settingName  the setting name
   * @param  {Object}          value        the value to be set
   * @return {Promise}                      nothing
   */
  async setUserSetting(source, orgId, userId, settingName, value) {
    await this.userSettingsTable.setSetting(source, orgId, userId, settingName, value);
  }

  /**
   * Removes value from a setting for a given user in an organization.
   * @param  {string}  source      the source name (like Discord etc.)
   * @param  {string}  orgId       the organization identifier
   * @param  {string}  userId      the user identifier
   * @param  {string}  settingName the setting name
   * @return {Promise}             nothing
   */
  async removeUserSetting(source, orgId, userId, settingName) {
    await this.userSettingsTable.removeSetting(source, orgId, userId, settingName);
  }

  /**
   * Gets all data related to a user (needed for privacy regulations).
   * @param  {string}          source      the source name (like Discord etc.)
   * @param  {string}          userId      the user identifier
   * @param  {LangManager}     langManager the language manager to describe the contents
   * @return {Promise<string>}             the string representing the stored data related to the user
   */
  async getUserData(source, userId, langManager) {
    let info = '';
    switch (source) {
      case BotTable.DISCORD_SOURCE:
        info = await this.getUserDiscordData(userId, langManager);
        break;
      default:
        break;
    }
    return info;
  }

  /**
   * Gets all data directly related to a Discord user (needed for privacy regulations).
   * Shall be used only when replying to this particular user in a private message.
   * @param  {string}          userId      the user identifier
   * @param  {LangManager}     langManager the language manager to describe the contents
   * @return {Promise<string>}             the string representing the stored data related to the user
   */
  async getUserDiscordData(userId, langManager) {
    if (langManager === undefined) {
      langManager = this.context.langManager;
    }

    const orgs = await this.getDiscordRows(this.orgsTable);
    const channels = await this.getDiscordRows(this.channelsTable);
    const roles = await this.getDiscordRows(this.rolesTable);

    const userInfoRows = await this.membersTable.getRows({ source: BotTable.DISCORD_SOURCE, id: userId });

    let result = '';

    if (userInfoRows.length > 0) {
      result = result + langManager.getString('privacy_guild_member_records') + '\n';
      for (const userInfoRow of userInfoRows) {
        const dbRecord = orgs.find(org => {
          return org.id === userInfoRow.orgId;
        });
        userInfoRow.orgId = userInfoRow.orgId + (dbRecord === undefined ? '' : ' (' + dbRecord.name + ')');
        result = result + util.inspect(userInfoRow) + '\n';
      }
    } else {
      result = result + langManager.getString('privacy_no_guild_member_records') + '\n';
    }

    const userSettingsRows = await this.userSettingsTable.getRows({ source: BotTable.DISCORD_SOURCE, userId: userId });

    if (userSettingsRows.length > 0) {
      result = result + langManager.getString('privacy_user_settings_records') + '\n';
      for (const userSettingsRow of userSettingsRows) {
        const dbRecord = orgs.find(org => {
          return org.id === userSettingsRow.orgId;
        });
        userSettingsRow.orgId = userSettingsRow.orgId + (dbRecord === undefined ? '' : ' (' + dbRecord.name + ')');
        result = result + util.inspect(userSettingsRow) + '\n';
      }
    } else {
      result = result + langManager.getString('privacy_no_user_settings_records') + '\n';
    }

    const permissionRows = await this.permissionsTable.getRows({
      source: BotTable.DISCORD_SOURCE,
      subjectType: PermissionsManager.SUBJECT_TYPES.user.name,
      subjectId: userId
    });

    if (permissionRows.length > 0) {
      result = result + langManager.getString('privacy_permissions_records') + '\n';
      for (const permissionRow of permissionRows) {
        const dbRecord = orgs.find(org => {
          return org.id === permissionRow.orgId;
        });
        permissionRow.orgId = permissionRow.orgId + (dbRecord === undefined ? '' : ' (' + dbRecord.name + ')');

        if (permissionRow.filter !== undefined && permissionRow.filter !== null) {
          const roleFilterValue = permissionRow.filter[PermissionsManager.DEFINED_FILTERS.roleId.name];
          const dbRoleRecord = roles.find(role => {
            return role.id === roleFilterValue;
          });
          if (roleFilterValue !== undefined) {
            permissionRow.filter[PermissionsManager.DEFINED_FILTERS.roleId.name] =
              roleFilterValue + (dbRoleRecord === undefined ? '' : ' (' + dbRoleRecord.name + ')');
          }

          const channelFilterValue = permissionRow.filter[PermissionsManager.DEFINED_FILTERS.channelId.name];
          const dbChannelRecord = channels.find(channel => {
            return channel.id === channelFilterValue;
          });
          if (channelFilterValue !== undefined) {
            permissionRow.filter[PermissionsManager.DEFINED_FILTERS.channelId.name] =
              channelFilterValue + (dbChannelRecord === undefined ? '' : ' (' + dbChannelRecord.name + ')');
          }
        }

        result = result + util.inspect(permissionRow) + '\n';
      }
    } else {
      result = result + langManager.getString('privacy_no_permissions_records') + '\n';
    }

    const warningsRows = await this.warningsTable.getRows({ source: BotTable.DISCORD_SOURCE, userId: userId });

    if (warningsRows.length > 0) {
      result = result + langManager.getString('privacy_warnings_records') + '\n';
      for (const warningRow of warningsRows) {
        const dbRecord = orgs.find(org => {
          return org.id === warningRow.orgId;
        });
        warningRow.orgId = warningRow.orgId + (dbRecord === undefined ? '' : ' (' + dbRecord.name + ')');
        result = result + util.inspect(warningRow) + '\n';
      }
    } else {
      result = result + langManager.getString('privacy_no_warnings_records') + '\n';
    }

    return result;
  }
}

/**
 * Exports the DbManager class
 * @type {DbManager}
 */
module.exports = DbManager;

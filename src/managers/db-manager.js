'use strict';

/**
 * @module db-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const util = require('util');
const OhUtils = require('../utils/bot-utils');

const ChannelsTable = require('../mongo_classes/channels-table');
const MembersTable = require('../mongo_classes/members-table');
const PermissionsTable = require('../mongo_classes/permissions-table');
const RolesTable = require('../mongo_classes/roles-table');
const TasksTable = require('../mongo_classes/tasks-table');
const ServerSettingsTable = require('../mongo_classes/server-settings-table');
const UserSettingsTable = require('../mongo_classes/user-settings-table');

const CurrentVersion = 1;

/**
 * The denied tables.
 * @type {Object}
 */
const Tables = Object.freeze({
  channelsTable: ChannelsTable,
  membersTable: MembersTable,
  permissionsTable: PermissionsTable,
  rolesTable: RolesTable,
  tasksTable: TasksTable,
  serverSettingsTable: ServerSettingsTable,
  userSettingsTable: UserSettingsTable
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
    const initResults = [];
    for (const key of tablesKeys) {
      this[key] = new Tables[key](this);
      initResults.push(this[key].init());
    }

    await Promise.all(initResults);
  }

  /**
   * Updates a Discord guild according to the information fetched from the Client.
   * @todo to implement hard linking between tables, so when some entity gets removed from the guild,
   * related entities in other tables also get removed.
   * @param  {Guild}   guild the Discord guild
   * @return {Promise}       nothing
   */
  async updateGuild(guild) {
    await this.channelsTable.updateFromDiscord(guild, guild.channels.cache);
    await this.membersTable.updateFromDiscord(guild, guild.members.cache);
    await this.rolesTable.updateFromDiscord(guild, guild.roles.cache);
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
    this.context.log.v('insertOne: ' + util.inspect(entity, { showHidden: true, depth: 5 }));
    await this.dbo.collection(table.getTableName()).insertOne(entity);
  }

  /**
   * Inserts an object as a Discord entity, with id equal to the current max id in the organization + 1.
   * Does not insert if a duplicate was found with the same key (except the id column).
   * @param  {BotTable}         table  the table
   * @param  {string}           orgId  the organization identifier
   * @param  {Object}           entity the entity to be inserted
   * @return {Promise<Boolean>}        true if successful, false if a duplicate was found with the same key
   */
  async insertDiscordNext(table, orgId, entity) {
    const duplicateQuery = {};
    const keys = Object.keys(entity);
    for (const key of keys) {
      if (!table.getRowClass().getKeyColumns().includes(key)) {
        duplicateQuery[key] = entity[key];
      }
    }

    const duplicateRows = await this.getDiscordRows(table, orgId, duplicateQuery);
    if (duplicateRows !== null && duplicateRows.length > 0) {
      return false;
    }

    const currentRows = await this.getDiscordRows(table, orgId);
    const maxIndex = OhUtils.findMaxId(currentRows);

    entity.id = maxIndex + 1;

    await this.insertOne(table, entity);

    this.context.log.v('insertDiscordNext: ' + util.inspect(entity, { showHidden: true, depth: 5 }));

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
}

/**
 * Exports the DbManager class
 * @type {DbManager}
 */
module.exports = DbManager;

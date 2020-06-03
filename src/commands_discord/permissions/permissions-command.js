'use strict';

/**
 * @module permissions-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const OhUtils = require('../../utils/bot-utils');
const DiscordUtils = require('../../utils/discord-utils');
const BotPublicError = require('../../utils/bot-public-error');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');

const PermissionsManager = require('../../managers/permissions-manager');

const PermissionsCommandArgDefs = Object.freeze({
  permType: new CommandArgDef('permType', {
    aliasIds: ['command_permissions_arg_permType_alias_type', 'command_permissions_arg_permType_alias_t'],
    helpId: 'command_permissions_arg_permType_help',
  }),
});

/**
 * Command to list permissions set via Bot on the caller's Discord server.
 * @alias PermissionsCommand
 * @extends DiscordCommand
 */
class PermissionsCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {string}      orgId              the organization identifier
   * @param  {LangManager} commandLangManager the language manager
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, orgId, commandLangManager) {
    return new PermissionsCommand(context, source, orgId, commandLangManager);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_permissions_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return PermissionsCommandArgDefs;
  }

  /**
   * Gets the help text for the command (excluding the help text for particular arguments).
   * The lang manager is basically the manager from the HelpCommand's instance.
   * @see HelpCommand
   * @param  {Context}     context     the Bot's context
   * @param  {LangManager} langManager the language manager to localize the help text
   * @return {string}                  the localized help text
   */
  static getHelpText(context, langManager) {
    return langManager.getString('command_permissions_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [PermissionsManager.DISCORD_PERMISSIONS.ADMINISTRATOR];
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {Message}  discordMessage the command's message
   * @return {Promise}                 nothing
   */
  async validateFromDiscord(discordMessage) {
    await super.validateFromDiscord(discordMessage);

    if (this.permType !== null) {
      let foundIndex = -1;
      const permKeys = Object.keys(PermissionsManager.DEFINED_PERMISSIONS);
      for (const key of permKeys) {
        if (this.langManager.getString(PermissionsManager.DEFINED_PERMISSIONS[key].textId) === this.permType) {
          foundIndex = key;
          break;
        }
      }

      if (foundIndex < 0) {
        this.context.log.e(this.constructor.name + ' validateFromDiscord: invalid permType ' + this.permType);
        throw new BotPublicError(this.langManager.getString('command_permissions_error_wrong_type', this.permType));
      } else {
        this.permType = PermissionsManager.DEFINED_PERMISSIONS[foundIndex];
      }
    }
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {Message}         discordMessage the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForDiscord(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.getPermissionsDescription(
      discordMessage,
      'command_permissions_no_permissions',
      'command_permissions_permission'
    );
    /* eslint-enable no-return-await */
  }

  /**
   * Gets the filter object for permissions query.
   * @param  {Message} discordMessage  the Discord message
   * @return {Object}                  the filter
   */
  getFilter(discordMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    let typeFilter = {};
    if (this.permType !== null) {
      typeFilter = { permissionType: this.permType.name };
    }

    return typeFilter;
  }

  /**
   * Gets a summarized list of peermissions description according to the filter.
   * @param  {Message}         discordMessage the Discord message with the command
   * @param  {string}          emptyTextId    the text id to be used in case of no matching permissions found
   * @param  {string}          resultTextId   the text id to be used in case of matching permissions are found
   * @return {Promise<string>}                the result string to be replier the the caller
   */
  async getPermissionsDescription(discordMessage, emptyTextId, resultTextId) {
    const filter = this.getFilter(discordMessage);

    const permissions = await this.context.dbManager.getDiscordRows(
      this.context.dbManager.permissionsTable,
      this.orgId,
      filter
    );

    if (permissions.length === 0) {
      return this.langManager.getString(emptyTextId);
    }

    let result = '';
    for (const permission of permissions) {
      const filterDescription = this.makeFilterDescription(permission);

      let subjectTypeString = '';
      let subjectString = '';
      if (permission.subjectType === PermissionsManager.SUBJECT_TYPES.user.name) {
        subjectTypeString = this.langManager.getString(PermissionsManager.SUBJECT_TYPES.user.textId);
        subjectString = DiscordUtils.makeUserMention(permission.subjectId);
      } else {
        subjectTypeString = this.langManager.getString(PermissionsManager.SUBJECT_TYPES.role.textId);
        subjectString = DiscordUtils.makeRoleMention(permission.subjectId);
      }

      let permType = permission.permissionType;
      const permKeys = Object.keys(PermissionsManager.DEFINED_PERMISSIONS);
      for (const key of permKeys) {
        if (PermissionsManager.DEFINED_PERMISSIONS[key].name === permission.permissionType) {
          permType = this.langManager.getString(PermissionsManager.DEFINED_PERMISSIONS[key].textId);
          break;
        }
      }

      result =
        result +
        this.langManager.getString(
          resultTextId,
          permission.id,
          permType,
          subjectTypeString,
          subjectString,
          filterDescription
        ) +
        '\n';
    }

    return result;
  }

  /**
   * Makes the filter description for a granted permission.
   * @param  {OrgPermission} permission the permission
   * @return {string}                   the result text
   */
  makeFilterDescription(permission) {
    const filterKeys = Object.keys(permission.filter);
    let filterDescription = ' { ';
    for (const filterKey of filterKeys) {
      let filterFieldValue = '';
      let foundInChannelFilters = false;
      for (let k = 0; k < PermissionsManager.DISCORD_CHANNELS_FILTERS.length; k++) {
        if (PermissionsManager.DISCORD_CHANNELS_FILTERS[k].name === filterKey) {
          if (permission.filter[filterKey] === OhUtils.ANY_VALUE) {
            filterFieldValue = this.langManager.getString(DiscordCommand.ANY_VALUE_TEXT);
          } else {
            filterFieldValue = DiscordUtils.makeChannelMention(permission.filter[filterKey]);
          }

          foundInChannelFilters = true;
        }
      }

      let foundInMembersFilters = false;
      for (let k = 0; k < PermissionsManager.DISCORD_MEMBERS_FILTERS.length; k++) {
        if (PermissionsManager.DISCORD_MEMBERS_FILTERS[k].name === filterKey) {
          if (permission.filter[filterKey] === OhUtils.ANY_VALUE) {
            filterFieldValue = this.langManager.getString(DiscordCommand.ANY_VALUE_TEXT);
          } else {
            filterFieldValue = DiscordUtils.makeUserMention(permission.filter[filterKey]);
          }

          foundInMembersFilters = true;
        }
      }

      let foundInRolesFilters = false;
      for (let k = 0; k < PermissionsManager.DISCORD_ROLES_FILTERS.length; k++) {
        if (PermissionsManager.DISCORD_ROLES_FILTERS[k].name === filterKey) {
          if (permission.filter[filterKey] === OhUtils.ANY_VALUE) {
            filterFieldValue = this.langManager.getString(DiscordCommand.ANY_VALUE_TEXT);
          } else {
            filterFieldValue = DiscordUtils.makeRoleMention(permission.filter[filterKey]);
          }

          foundInRolesFilters = true;
        }
      }

      if (!foundInChannelFilters && !foundInMembersFilters && !foundInRolesFilters) {
        filterFieldValue = permission.filter[filterKey];
      }

      filterDescription =
        filterDescription +
        ' ' +
        this.langManager.getString(PermissionsManager.DEFINED_FILTERS[filterKey].textId) +
        ' : ' +
        filterFieldValue +
        ';';
    }

    filterDescription += ' } ';

    return filterDescription;
  }
}

/**
 * Exports the PermissionsCommand class
 * @type {PermissionsCommand}
 */
module.exports = PermissionsCommand;

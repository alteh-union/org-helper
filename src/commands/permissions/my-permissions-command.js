'use strict';

/**
 * @module my-permissions-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const PermissionsCommand = require('./permissions-command');

const PermissionsManager = require('../../managers/permissions-manager');

/**
 * Command to list caller's permissions set via the Bot on the Discord server.
 * @alias MyPermissionsCommand
 * @extends PermissionsCommand
 */
class MyPermissionsCommand extends PermissionsCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new MyPermissionsCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_mypermissions_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_mypermissions_displayname';
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
    return langManager.getString('command_mypermissions_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [];
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    // Keep "return await" to properly catch exceptions from the inside.
    /* eslint-disable no-return-await */
    return await this.getPermissionsDescription(
      message,
      'command_mypermissions_no_permissions',
      'command_mypermissions_permission'
    );
    /* eslint-enable no-return-await */
  }

  /**
   * Gets the filter object for permissions query.
   * @param  {BaseMessage} message  the Discord message
   * @return {Object}               the filter
   */
  async getFilter(message) {
    const membersManager = await message.source.client.guilds.cache.get(message.orgId).members;
    const member = await membersManager.fetch(message.userId);
    const rolesArray = member.roles.cache.array();
    const orArray = [];
    for (const role of rolesArray) {
      orArray.push({
        $and: [{ subjectType: PermissionsManager.SUBJECT_TYPES.role.name }, { subjectId: role.id }]
      });
    }

    orArray.push({
      $and: [{ subjectType: PermissionsManager.SUBJECT_TYPES.user.name }, { subjectId: message.userId }]
    });

    const andArray = [{ $or: orArray }];

    if (this.permType !== null) {
      andArray.push({ permissionType: this.permType.name });
    }

    return { $and: andArray };
  }
}

/**
 * Exports the MyPermissionsCommand class
 * @type {MyPermissionsCommand}
 */
module.exports = MyPermissionsCommand;

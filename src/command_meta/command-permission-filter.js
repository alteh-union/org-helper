'use strict';

/**
 * @module command-permission-filter
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Definition for a command's permission filter. The filter contains the permission names
 * and particular properties to check against command's arguments.
 * @see PermissionsManager#checkBotPermissions
 * @see CommandPermissionFilterField
 * @alias CommandPermissionFilter
 */
class CommandPermissionFilter {
  /**
   * Constructs an instance of the class.
   * @param {string}                              permissionName permission's name
   * @param {Array<CommandPermissionFilterField>} filterFields   array of fields to filter the permission with
   */
  constructor(permissionName, filterFields) {
    this.permissionName = permissionName;
    this.filterFields = filterFields;
  }
}

/**
 * Exports the CommandPermissionFilter class
 * @type {CommandPermissionFilter}
 */
module.exports = CommandPermissionFilter;

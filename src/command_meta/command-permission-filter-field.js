'use strict';

/**
 * @module command-permission-filter-field
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Definition for a command's permission filter's field. The field defines which command's argument
 * need to match which DB field of the stored permission.
 * @see PermissionsManager#checkBotPermissions
 * @see CommandPermissionFilter
 * @alias CommandPermissionFilterField
 */
class CommandPermissionFilterField {
  /**
   * Constructs an instance of the class.
   * @param {string} filterFieldName the name of the field from permission's DB row
   * @param {string} argName         the name of the command's arg which value should match the DB field value
   */
  constructor(filterFieldName, argName) {
    this.filterFieldName = filterFieldName;
    this.argName = argName;
  }
}

/**
 * Exports the CommandPermissionFilterField class
 * @type {CommandPermissionFilterField}
 */
module.exports = CommandPermissionFilterField;

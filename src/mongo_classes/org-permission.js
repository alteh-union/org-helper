'use strict';

/**
 * @module org-permission
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const PermissionsColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  subjectType: 'subjectType',
  subjectId: 'subjectId',
  permissionType: 'permissionType',
  filter: 'filter'
});

/**
 * Represents a DB row of a permission.
 * @see PermissionsTable
 * @alias OrgPermission
 * @extends BotRow
 */
class OrgPermission extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(PermissionsColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [PermissionsColumns.id, PermissionsColumns.source, PermissionsColumns.orgId];
  }

  /**
   * Gets the array of unique indices, each containing the list of columns to be unique.
   * @return {Array<Array<string>>} the array of indices
   */
  static getUniqueIndices() {
    return [[PermissionsColumns.source, PermissionsColumns.orgId, PermissionsColumns.subjectType,
      PermissionsColumns.subjectId, PermissionsColumns.permissionType, PermissionsColumns.filter]];
  }
}

/**
 * Exports the OrgPermission class
 * @type {OrgPermission}
 */
module.exports = OrgPermission;

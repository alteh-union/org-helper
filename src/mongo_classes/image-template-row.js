'use strict';

/**
 * @module image-template
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotRow = require('./bot-row');

const ImageTemplateColumns = Object.freeze({
  id: 'id',
  source: 'source',
  orgId: 'orgId',
  config: 'config'
});

/**
 * Represents a DB row of an image template
 * @see MembersTable
 * @alias OrgMember
 * @extends BotRow
 */
class ImageTemplate extends BotRow {
  /**
   * Gets all defined columns of the DB row.
   * @return {Array<string>} the array of column names
   */
  static getColumns() {
    return Object.values(ImageTemplateColumns);
  }

  /**
   * Gets key defined columns of the DB row.
   * @return {Array<string>} the array of key column names
   */
  static getKeyColumns() {
    return [ImageTemplateColumns.id, ImageTemplateColumns.source, ImageTemplateColumns.orgId];
  }
}

/**
 * Exports the OrgMember class
 * @type {OrgMember}
 */
module.exports = ImageTemplate;

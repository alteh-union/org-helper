'use strict';

/**
 * @module members-table
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotTable = require('./bot-table');
const ImageTemplate = require('./image-template-row');


const IMAGE_TEMPLATE_TABLE_NAME = 'image_template';

/**
 * Represents organization image_template table.
 * @see OrgMember
 * @alias MembersTable
 * @extends BotTable
 */
class ImageTemplateTable extends BotTable {
  /**
   * Gets the class representing a row in this collection.
   * @return {Object} the row class
   */
  getRowClass() {
    return ImageTemplate;
  }

  /**
   * Gets an instance of a class representing a row in this collection, based on the provided values
   * @param  {Object} dbObj the raw object from DB
   * @return {Object}       the row class' instance
   */
  getRowInstance(dbObject) {
    return new ImageTemplate(dbObject);
  }

  /**
   * Gets this collection's name.
   * @return {string} the table name
   */
  getTableName() {
    return IMAGE_TEMPLATE_TABLE_NAME;
  }
}

/**
 * Exports the MembersTable class
 * @type {MembersTable}
 */
module.exports = ImageTemplateTable;

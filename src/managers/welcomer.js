'use strict';

/**
 * @module welcomer
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const ServerSettingsTable = require('../mongo_classes/server-settings-table');

const USERNAME_PLACEHOLDER = '%username%';

/**
 * Posts welcome messages when new users arrive (if the message is set up for the org).
 * @alias Welcomer
 */
class Welcomer {
  /**
   * Constructs an instance of the class
   * @param {Context} context the Bot's context
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Posts the welcome message, if it's set up.
   * Substitutes the %username% placeholder in the message (if present) with the actual user name.
   * @param  {string}  message  the message from the system according to which a new user appeared in the org
   * @param  {string}  userId   the id of the user to greet (will substitute the %username% placeholder)
   * @return {Promise}          nothing
   */
  async welcomeUser(message, userId) {
    const welcomeMessage = await this.context.dbManager.getSetting(
      message.source.name,
      message.orgId,
      ServerSettingsTable.SERVER_SETTINGS.welcomeMessage.name,
      null
    );

    if (!welcomeMessage) {
      return;
    }

    const userMention = await message.source.makeUserMention(message, userId);

    await message.source.replyToMessage(message, welcomeMessage.replace(USERNAME_PLACEHOLDER, userMention));
  }
}

/**
 * Exports the Welcomer class
 * @type {Welcomer}
 */
module.exports = Welcomer;

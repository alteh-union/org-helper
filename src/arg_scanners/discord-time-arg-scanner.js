'use strict';

/**
 * @module discord-time-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const TimeArgScanner = require('./time-arg-scanner');
const ScannerUiType = require('./scanner-ui-type');

const TimeArg = require('../command_meta/time-arg');

const ServerSettingsTable = require('../mongo_classes/server-settings-table');
const UserSettingsTable = require('../mongo_classes/user-settings-table');

const DefaultTimeZone = 'Etc/UTC';

/**
 * Scans argument as a time definition (time distance or one-shot/recurrent schedule) considering Discord
 * user's or server's timezone.
 * @alias DiscordTimeArgScanner
 * @extends TimeArgScanner
 */
class DiscordTimeArgScanner extends TimeArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.timeType;
  }

  /**
   * Appends a timezone definition to a TimeArg, based on organization's or individual preference for the timezone.
   * @see TimeArg
   * @param  {Context}      context     the Bot's context
   * @param  {BaseMessage}  message     the Discord message with the argument
   * @param  {TimeArg}      timeArg     the time argument to edit
   * @return {Promise}                  nothing
   */
  static async appendTimezone(context, message, timeArg) {
    if (timeArg.timeType === TimeArg.DISTANCE_TYPE) {
      return;
    }

    const serverTimezone = await context.dbManager.getSetting(
      message.source.name,
      message.orgId,
      ServerSettingsTable.SERVER_SETTINGS.timezone.name
    );

    const userTimezone = await context.dbManager.getUserSetting(
      message.source.name,
      message.orgId,
      message.userId,
      UserSettingsTable.USER_SETTINGS.timezone.name
    );

    let tz = DefaultTimeZone;
    if (userTimezone !== undefined) {
      tz = userTimezone;
    } else if (serverTimezone !== undefined) {
      tz = serverTimezone;
    }

    timeArg.addParsedDefinition({ amount: tz, shiftType: TimeArg.SHIFT_TYPES.timezone });
  }
}

/**
 * Exports the DiscordTimeArgScanner class
 * @type {DiscordTimeArgScanner}
 */
module.exports = DiscordTimeArgScanner;

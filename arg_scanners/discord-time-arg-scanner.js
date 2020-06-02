'use strict';

/**
 * @module discord-time-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

const TimeArgScanner = require('./time-arg-scanner');

const TimeArg = require('../command_meta/time-arg');

const BotTable = require('../mongo_classes/bot-table');
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
   * Appends a timezone definition to a TimeArg, based on organization's or individual preference for the timezone.
   * @see TimeArg
   * @param  {Context}      context     the Bot's context
   * @param  {Message}      message     the Discord message with the argument
   * @param  {TimeArg}      timeArg     the time argument to edit
   * @return {Promise}                  nothing
   */
  static async appendTimezone(context, message, timeArg) {
    if (timeArg.timeType === TimeArg.DISTANCE_TYPE) {
      return;
    }

    const serverTimezone = await context.dbManager.getSetting(BotTable.DISCORD_SOURCE, message.guild.id,
      ServerSettingsTable.SERVER_SETTINGS.timezone.name);

    const userTimezone = await context.dbManager.getUserSetting(BotTable.DISCORD_SOURCE, message.guild.id,
      message.member.id, UserSettingsTable.USER_SETTINGS.timezone.name);

    let tz = DefaultTimeZone;
    if (userTimezone !== undefined) {
      tz = userTimezone;
    } else if (serverTimezone !== undefined) {
      tz = serverTimezone;
    }

    timeArg.addParsedDefinition({amount: tz, shiftType: TimeArg.SHIFT_TYPES.timezone});
  }
}

/**
 * Exports the DiscordTimeArgScanner class
 * @type {DiscordTimeArgScanner}
 */
module.exports = DiscordTimeArgScanner;

'use strict';

/**
 * @module base-moderation-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const OhUtils = require('../../utils/bot-utils');
const DiscordUtils = require('../../utils/discord-utils');

const DiscordCommand = require('../discord-command');

const OrgChannel = require('../../mongo_classes/org-channel');
const ServerSettingsTable = require('../../mongo_classes/server-settings-table');

const DefaultLogChannel = 'moder-logs';

/**
 * Base (abstract) command for moderation actions which needs to be logged into a special channel.
 * Expected inheritor commands: kick, ban, warn, softban etc.
 * @abstract
 * @alias BaseModerationCommand
 * @extends DiscordCommand
 */
class BaseModerationCommand extends DiscordCommand {
  /**
   * The name of the default text channel where the logs will be placed.
   * @see SetModerLogsChannelCommand
   * @type {string}
   */
  static get DEFAULT_LOG_CHANNEL() {
    return DefaultLogChannel;
  }

  /**
   * Logs a text into the moderation logs channel (if applicable according to the server settings).
   * @param  {string}  text the text to be logged
   * @return {Promise}      nothing
   */
  async logModerAction(text) {
    const loggingEnabled = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.moderLogsEnabled.name,
      OhUtils.OFF
    );

    if (loggingEnabled === OhUtils.OFF) {
      return;
    }

    const channelId = await this.context.dbManager.getSetting(
      this.source,
      this.orgId,
      ServerSettingsTable.SERVER_SETTINGS.moderLogsChannel.name,
      null
    );

    const channelsManager = this.context.discordClient.guilds.cache.get(this.orgId).channels;
    const channelsCache = channelsManager.cache;

    let targetChannel = await channelsCache.find(channel =>
      channel.type === OrgChannel.getTextType() && channel.id === channelId);

    if (targetChannel === undefined) {
      targetChannel = await channelsCache.find(channel =>
        channel.type === OrgChannel.getTextType() && channel.name === DefaultLogChannel);
    }

    if (targetChannel === undefined) {
      try {
        await channelsManager.create(DefaultLogChannel, { type: OrgChannel.getTextType() });
      } catch (e) {
        this.context.log.e("Error creating text channel with name " + DefaultLogChannel + " for guild " + this.orgId +
          ' stack: ' + e.stack);
      }

      targetChannel = await channelsCache.find(channel =>
        channel.type === OrgChannel.getTextType() && channel.name === DefaultLogChannel);
    }

    if (targetChannel === undefined) {
      this.context.log.e("Cannot add moder logs: text channel " + DefaultLogChannel + " not found even" +
        " after trying to create it.");
    } else {
      await DiscordUtils.sendToTextChannel(targetChannel, text);
    }
  }
}

/**
 * Exports the BaseModerationCommand class
 * @type {BaseModerationCommand}
 */
module.exports = BaseModerationCommand;

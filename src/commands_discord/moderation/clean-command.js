'use strict';

/**
 * @module clean-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const SimpleArgScanner = require('../../arg_scanners/simple-arg-scanner');
const TimeArgScanner = require('../../arg_scanners/time-arg-scanner');
const DiscordChannelsArgScanner = require('../../arg_scanners/discord-channels-arg-scanner');

const PermissionsManager = require('../../managers/permissions-manager');

const CleanCommandArgDefs = Object.freeze({
  time: new CommandArgDef('time', {
    aliasIds: ['command_clean_arg_time_alias_time', 'command_clean_arg_time_alias_t'],
    helpId: 'command_clean_arg_time_help',
    scanner: TimeArgScanner,
    validationOptions: { timeDistanceOnly: true, nonZeroShift: true }
  }),
  channelIds: new CommandArgDef('channelIds', {
    aliasIds: ['command_clean_arg_channelIds_alias_channelIds', 'command_clean_arg_channelIds_alias_c'],
    helpId: 'command_clean_arg_channelIds_help',
    skipInSequentialRead: true,
    scanner: DiscordChannelsArgScanner,
    validationOptions: { validTextChannels: true }
  }),
  silent: new CommandArgDef('silent', {
    aliasIds: ['command_clean_arg_silent_alias_silent', 'command_clean_arg_silent_alias_s'],
    helpId: 'command_clean_arg_silent_help',
    scanner: SimpleArgScanner
  })
});

const SilentArgPredefinedValues = Object.freeze({
  silent: 'command_clean_arg_silent_value_silent',
  s: 'command_clean_arg_silent_value_s'
});

const MESSAGES_FETCH_LIMIT = 50;

const TIME_LIMIT_FOR_BULK_DELETE = 1000 * 60 * 60 * 24 * 14 - 60 * 1000;

/**
 * Command to clean Discord text-channels from recent messages.
 * @alias CleanCommand
 * @extends DiscordCommand
 */
class CleanCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new CleanCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_clean_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return CleanCommandArgDefs;
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
    return langManager.getString('command_clean_help');
  }

  /**
   * Gets the array of defined Discord permission filters for the command.
   * Source-independent permissions (e.g. stored in the Bot's DB) should be defined in another place.
   * @return {Array<string>} the array of Discord-specific permissions required
   */
  static getRequiredDiscordPermissions() {
    return [PermissionsManager.DISCORD_PERMISSIONS.MANAGE_MESSAGES];
  }

  /**
   * Gets the default value for a given argument definition.
   * Used when unable to scan the argument from the command's text.
   * @param  {BaseMessage}    message the command's message
   * @param  {CommandArgDef}  arg     the argument definition
   * @return {Promise}                the default value
   */
  async getDefaultDiscordArgValue(message, arg) {
    switch (arg) {
      case CleanCommandArgDefs.channelIds:
        return message.channelId;
      default:
        return null;
    }
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the Discord message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async executeForDiscord(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    const timestampLimit = message.originalMessage.createdTimestamp - this.time.totalMillisecondsShift;

    let deletedCount = 0;
    let checkedCount = 0;

    // Discord JS does not allow to fetch all messages at once, so we read them in batches
    // at stop when either we find too old messages, or when we deleted all messages.
    // Since here each next step relies on results of the previous step, we should use await inside the loop.
    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < this.channelIds.channels.length; i++) {
      let needRefetch = false;
      do {
        needRefetch = false;
        const channel = message.source.client.guilds.cache
          .get(this.orgId)
          .channels.cache.get(this.channelIds.channels[i]);
        const messages = await channel.messages.fetch({ limit: MESSAGES_FETCH_LIMIT });
        const messagesArray = Array.from(messages.values());
        if (messagesArray.length === 0) {
          break;
        }

        const currentTimeMillis = new Date().getTime();

        const messagesToDeleteAsBulk = [];
        const messagesToDeleteIndividually = [];
        for (const message of messagesArray) {
          this.context.log.v(
            'messages delete check; id = ' +
              message.id +
              '; timestamp: ' +
              message.createdTimestamp +
              '; limit ' +
              timestampLimit
          );
          if (message.createdTimestamp > timestampLimit) {
            needRefetch = true;
            deletedCount++;
            if (currentTimeMillis - TIME_LIMIT_FOR_BULK_DELETE < message.createdTimestamp) {
              messagesToDeleteAsBulk.push(message);
            } else {
              messagesToDeleteIndividually.push(message);
            }
          }

          checkedCount++;
        }

        await channel.bulkDelete(messagesToDeleteAsBulk);
        for (const message of messagesToDeleteIndividually) {
          await message.delete();
        }
      } while (needRefetch);
    }
    /* eslint-enable no-await-in-loop */

    this.context.log.i(
      'CleanCommand done: deleted ' +
        deletedCount +
        ' out of checked ' +
        checkedCount +
        ' messages in ' +
        this.channelIds.channels.length +
        ' channels'
    );

    let result = '';
    if (!this.isSilent(this.context)) {
      if (this.channelIds.channels.length > 1) {
        result = this.langManager.getString(
          'command_clean_success_multi_channels',
          deletedCount,
          checkedCount,
          this.channelIds.channels.length
        );
      } else {
        result = this.langManager.getString('command_clean_success', deletedCount, checkedCount);
      }
    }

    return result;
  }

  /**
   * Checks if need to consider the "silent" arg input as true.
   * @return {Boolean} true if silent, otherwise false
   */
  isSilent() {
    if (this.silent === null || this.silent === undefined) {
      return false;
    }

    if (this.silent === '') {
      return true;
    }

    const silentKeys = Object.keys(SilentArgPredefinedValues);
    for (const key of silentKeys) {
      if (this.silent === this.langManager.getString(SilentArgPredefinedValues[key])) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Exports the CleanCommand class
 * @type {CleanCommand}
 */
module.exports = CleanCommand;

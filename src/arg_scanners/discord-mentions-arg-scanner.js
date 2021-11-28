'use strict';

/**
 * @module discord-mentions-arg-scanner
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordUtils = require('../utils/discord-utils');

const GetMentionSuggestions = require('../commands_discord/suggestions/get-mention-suggestions');

const ArrayArgScanner = require('./array-arg-scanner');
const ScannerUiType = require('./scanner-ui-type');

/**
 * Scans arguments as a an array of ids from a comma separated list of Discord mentions.
 * Abstract.
 * @abstract
 * @alias DiscordMentionsArgScanner
 * @extends ArrayArgScanner
 */
class DiscordMentionsArgScanner extends ArrayArgScanner {
  /**
   * Returns the input type which should be used for corresponding arguments in UI.
   * @return {string} the type identifier
   */
  static getUiType() {
    return ScannerUiType.TYPES.mentionsType;
  }

  /**
   * Returns the command class which can be used to get suggestions on input for this kind of argument.
   * @return {constructor} the command class
   */
  static getSuggestionsCommand() {
    return GetMentionSuggestions;
  }

  /**
   * Parses the given text to make an argument object for a command.
   * @param  {Context}         context     Bot's context
   * @param  {LangManager}     langManager Lang manager of the command
   * @param  {Object}          message     Message's object (source-dependent)
   * @param  {string}          text        Text to be scanned to parse the argument
   * @param  {string}          scanType    The type of scan (by name, sequential etc.)
   * @return {Promise<Object>}             Promise of the parsed object of the argument and how many chars were scanned
   */
  static async scan(context, langManager, message, text, scanType) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    throw new Error('scan: ' + this.name + ' is an abstract class');
  }

  /**
   * Parses Discord mentions (channels, roles, members) using the specified prefixes into pure ids.
   * @param  {Context}       context             Bot's context
   * @param  {Object}        message             Message's object (source-dependent)
   * @param  {string}        argText             the text to be parsed
   * @param  {string}        directPrefix        the prefix of the mention defined by its pure id
   * @param  {string}        mentionType         the type of mention (member, role, channel)
   * @return {Array<string>}                     the array of parsed identifiers
   */
  static async parseDiscordMentions(context, message, argText, directPrefix, mentionType) {
    const parsedMentions = [];
    const mentions = argText.split(this.ARRAY_SEPARATOR);
    for (let i = 0; i < mentions.length; i++) {
      mentions[i] = mentions[i].trim();

      if (/^\d+$/.test(mentions[i])) {
        parsedMentions.push(mentions[i]);
        continue;
      }

      if (
        mentions[i].startsWith(DiscordUtils.DISCORD_MENTION_START) &&
        mentions[i].endsWith(DiscordUtils.DISCORD_MENTION_END)
      ) {
        mentions[i] = mentions[i].slice(1, -1);

        if (!mentions[i].startsWith(directPrefix)) {
          continue;
        }

        mentions[i] = mentions[i].slice(directPrefix.length);

        if (!/^\d+$/.test(mentions[i])) {
          continue;
        }

        parsedMentions.push(mentions[i]);

      } else if (mentions[i].startsWith(DiscordUtils.DISCORD_SUBJECT_PREFIX) &&
        mentionType === DiscordUtils.MENTION_TYPES.member) {

        mentions[i] = mentions[i].slice(1);

        const guild = context.discordClient.guilds.cache.get(message.orgId);
        if (guild) {
          const membersCollection = await guild.members.fetch();
          if (mentions[i].indexOf(DiscordUtils.DISCORD_DISCRIMINATOR_SEPARATOR)) {
            const foundMember = membersCollection.find(member => DiscordUtils.getDiscordUserName(
              member.user.username,
              member.user.discriminator.toString()
            ) === mentions[i]);
            if (foundMember) {
              if (!/^\d+$/.test(foundMember.id)) {
                continue;
              }

              parsedMentions.push(foundMember.id);
            }
          } else {
            const foundMember = membersCollection.find(member => member.user.username === mentions[i] ||
                member.nickname === mentions[i]);
            if (foundMember) {
              if (!/^\d+$/.test(foundMember.id)) {
                continue;
              }

              parsedMentions.push(foundMember.id);
            }
          }
        }
      } else if (mentions[i].startsWith(DiscordUtils.DISCORD_SUBJECT_PREFIX) &&
        mentionType === DiscordUtils.MENTION_TYPES.role) {

        mentions[i] = mentions[i].slice(1);

        const guild = context.discordClient.guilds.cache.get(message.orgId);
        if (guild) {
          const rolesCollection = await guild.roles.fetch();
          const roles = Array.from(rolesCollection.cache.values());

          const foundRole = roles.find(role => role.name === mentions[i]);
          if (foundRole) {
            if (!/^\d+$/.test(foundRole.id)) {
              continue;
            }

            parsedMentions.push(foundRole.id);
          }
        }
      } else if (mentions[i].startsWith(DiscordUtils.DISCORD_CHANNEL_PREFIX) &&
        mentionType === DiscordUtils.MENTION_TYPES.channel) {

        mentions[i] = mentions[i].slice(1);

        const guild = context.discordClient.guilds.cache.get(message.orgId);
        if (guild) {
          const foundChannel = guild.channels.cache.find(channel => channel.name === mentions[i]);
          if (foundChannel) {
            if (!/^\d+$/.test(foundChannel.id)) {
              continue;
            }

            parsedMentions.push(foundChannel.id);
          }
        }
      }
    }

    return parsedMentions;
  }
}

/**
 * Exports the DiscordMentionsArgScanner class
 * @type {DiscordMentionsArgScanner}
 */
module.exports = DiscordMentionsArgScanner;

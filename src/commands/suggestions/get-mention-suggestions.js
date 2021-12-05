'use strict';

/**
 * @module get-mention-suggestions
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordUtils = require('../../utils/discord-utils');

const Command = require('../command');
const ArgSuggestion = require('../../command_meta/arg-suggestion');
const OrgChannel = require('../../mongo_classes/org-channel');

/**
 * Command to get suggestions about available locales.
 * @alias GetMentionSuggestions
 * @extends Command
 */
class GetMentionSuggestions extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new GetMentionSuggestions(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'get_mention_suggestions_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    throw new Error('DISPLAY_NAME: ' + this.name + ' is a suggestions command and should not have a display name.');
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
    throw new Error('getHelpText: ' + this.name + ' is a suggestions command and should not have a help text.');
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the message as the source of the command
   * @return {Promise<string>}             the result text to be replied as the response of the execution
   */
  async execute(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    await this.addChannelSuggestions(message);
    await this.addUserSuggestions(message);
    await this.addRoleSuggestions(message);
  }

  /**
   * Adds a list of channels in the org to the list of suggestions.
   * @param  {BaseMessage}                   message the message as the source of the command
   * @return {Promise<Array<ArgSuggestion>>}         the array of channel suggestions
   */
  async addChannelSuggestions(message) {
    const guild = this.context.discordClient.guilds.cache.get(this.orgId);
    if (guild === undefined) {
      return [];
    }

    const channelNames = guild.channels.cache.filter(channel => OrgChannel.isTextType(channel.type))
      .map(channel => DiscordUtils.makeChannelMentionByName(channel.name));
    for (const channelName of channelNames) {
      message.replyResult.suggestions.push(new ArgSuggestion(channelName, ""));
    }
  }

  /**
   * Adds a list of users in the org to the list of suggestions.
   * @param  {BaseMessage}                   message the message as the source of the command
   * @return {Promise<Array<ArgSuggestion>>}         the array of user suggestions
   */
  async addUserSuggestions(message) {
    const guild = this.context.discordClient.guilds.cache.get(this.orgId);
    if (guild === undefined) {
      return [];
    }

    const memberNames = (await guild.members.fetch()).map(member => DiscordUtils.makeSubjectMentionByName(
      DiscordUtils.getDiscordUserName(
        member.user.username,
        member.user.discriminator.toString()
      )
    ));
    for (const memberName of memberNames) {
      message.replyResult.suggestions.push(new ArgSuggestion(memberName, ""));
    }
  }

  /**
   * Adds a list of roles in the org to the list of suggestions.
   * @param  {BaseMessage}                   message the message as the source of the command
   * @return {Promise<Array<ArgSuggestion>>}         the array of role suggestions
   */
  async addRoleSuggestions(message) {
    const guild = this.context.discordClient.guilds.cache.get(this.orgId);
    if (guild === undefined) {
      return [];
    }

    const rolesCollection = await guild.roles.fetch();
    const roles = Array.from(rolesCollection.cache.values());
    const roleNames = roles.map(role => DiscordUtils.makeSubjectMentionByName(role.name));
    for (const roleName of roleNames) {
      message.replyResult.suggestions.push(new ArgSuggestion(roleName, ""));
    }
  }
}

/**
 * Exports the GetMentionSuggestions class
 * @type {GetMentionSuggestions}
 */
module.exports = GetMentionSuggestions;

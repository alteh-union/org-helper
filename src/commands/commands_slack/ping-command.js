'use strict';

/**
 * @module ping-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const SlackCommand = require('../commands_slack/slack-command');

/**
 * Command to ping the Bot.
 * @alias PingCommand
 * @extends SlackCommand
 */
class PingCommand extends SlackCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Slack etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new PingCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_ping_name';
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
    return langManager.getString('command_ping_help');
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {Message}         slackMessage the Slack message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForSlack(slackMessage) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */
    this.context.log.v('ping message timestamp: ', slackMessage.createdTimestamp);
    return this.langManager.getString('command_ping_success');
  }
}

/**
 * Exports the PingCommand class
 * @type {PingCommand}
 */
module.exports = PingCommand;

'use strict';

/**
 * @module list-image-templates-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');

const ArgSuggestion = require('../../command_meta/arg-suggestion');

/**
 * Command to list available image templates.
 * @alias ListImageTemplatesCommand
 * @extends DiscordCommand
 */
class ListImageTemplatesCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new ListImageTemplatesCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_listimagetemplates_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_listimagetemplates_displayname';
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
    return langManager.getString('command_listimagetemplates_help');
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
    const res = await this.context.dbManager.getDiscordRows(
      this.context.dbManager.imageTemplateTable,
      this.orgId,
      {});

    const ids = res.map(r => r.id);
    for (const id of ids) {
      message.replyResult.suggestions.push(new ArgSuggestion(id, ""));
    }

    return this.langManager.getString(
      'command_listimagetemplates_success',
      ids.join(', ')
    );
  }


}

/**
 * Exports the ListImageTemplatesCommand class
 * @type {ListImageTemplatesCommand}
 */
module.exports = ListImageTemplatesCommand;

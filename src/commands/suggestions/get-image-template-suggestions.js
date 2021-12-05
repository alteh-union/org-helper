'use strict';

/**
 * @module get-image-template-suggestions
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const ListImageTemplatesCommand = require('../image/list-image-templates-command');

/**
 * Command to get suggestions about image templates set up in the Discord org.
 * @alias GetImageTemplateSuggestions
 * @extends ListImageTemplatesCommand
 */
class GetImageTemplateSuggestions extends ListImageTemplatesCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new GetImageTemplateSuggestions(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'get_image_template_suggestions_name';
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
}

/**
 * Exports the GetImageTemplateSuggestions class
 * @type {GetImageTemplateSuggestions}
 */
module.exports = GetImageTemplateSuggestions;

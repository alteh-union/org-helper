'use strict';

/**
 * @module add-image-template-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const BotPublicError = require('../../utils/bot-public-error');
const BotUtils = require('../../utils/bot-utils');

const Command = require('../command');
const SimpleArgScanner = require('../../arg_scanners/simple-arg-scanner');
const FullStringArgScanner = require('../../arg_scanners/full-string-arg-scanner');

const CommandArgDef = require('../../command_meta/command-arg-def');
const CommandPermissionFilter = require('../../command_meta/command-permission-filter');

const PermissionsManager = require('../../managers/permissions-manager');

const AddImageTemplateCommandArgDefs = Object.freeze({
  templateName: new CommandArgDef('templateName', {
    aliasIds: [
      'command_addimagetemplate_arg_templateName_alias_templateName',
      'command_addimagetemplate_arg_templateName_alias_n'
    ],
    helpId: 'command_addimagetemplate_arg_templateName_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: true }
  }),
  jsonConfig: new CommandArgDef('jsonConfig', {
    aliasIds: [
      'command_addimagetemplate_arg_jsonConfig_alias_jsonConfig',
      'command_addimagetemplate_arg_jsonConfig_alias_c'
    ],
    helpId: 'command_addimagetemplate_arg_jsonConfig_help',
    scanner: FullStringArgScanner,
    validationOptions: { nonNull: true }
  })
});

/**
 * Adds a new image template for the server.
 * @alias AddImageTemplateCommand
 * @extends Command
 */
class AddImageTemplateCommand extends Command {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new AddImageTemplateCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_addimagetemplate_name';
  }

  /**
   * Gets the user-friendly name of the command to display to the user (typically used in the Web interface).
   * @return {string} the user-friendly name
   */
  static get DISPLAY_NAME() {
    return 'command_addimagetemplate_displayname';
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
    return langManager.getString('command_addimagetemplate_help');
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return AddImageTemplateCommandArgDefs;
  }

  /**
   * Gets the array of defined Bot's permission filters for the command.
   * Source-defined permissions (e.g. Discord permissions) should be defined in another place.
   * @return {Array<CommandPermissionFilter>} the array of Bot's permission filters
   */
  static getRequiredBotPermissions() {
    return [
      new CommandPermissionFilter(PermissionsManager.DEFINED_PERMISSIONS.imagetemplate.name, [])
    ];
  }

  /**
   * Gets the default value for a given argument definition.
   * Used when unable to scan the argument from the command's text.
   * @param  {BaseMessage}    message the command's message
   * @param  {CommandArgDef}  arg     the argument definition
   * @return {Promise}                the default value
   */
  async getDefaultArgValue(message, arg) {
    switch (arg) {
      case AddImageTemplateCommandArgDefs.jsonConfig:
        return await message.source.readTextAttachment(message, ['txt', 'json'], this.context.log);
      default:
        return null;
    }
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {BaseMessage}  message the command's message
   * @return {Promise}              nothing
   */
  async validateArguments(message) {
    await super.validateArguments(message);

    try {
      this.parsedJsonConfig = JSON.parse(this.jsonConfig);
    } catch (e) {
      throw new BotPublicError(this.langManager.getString('command_addimagetemplate_malformed_template', e.message));
    }

    const complexity = BotUtils.calculateComplexity(this.parsedJsonConfig);
    if (complexity > this.context.prefsManager.max_image_template_complexity) {
      throw new BotPublicError(this.langManager.getString('command_addimagetemplate_too_complex_template',
        complexity, this.context.prefsManager.max_image_template_complexity));
    }

    const templateString = JSON.stringify(this.parsedJsonConfig);
    if (templateString.length < 3 || templateString.length > this.context.prefsManager.max_image_template_length) {
      throw new BotPublicError(this.langManager.getString('command_addimagetemplate_too_long_template',
        templateString.length, this.context.prefsManager.max_image_template_length));
    }

    if (this.parsedJsonConfig.input === undefined || this.parsedJsonConfig.input.type === undefined ||
      this.parsedJsonConfig.input.width === undefined || this.parsedJsonConfig.input.height === undefined) {
      throw new BotPublicError(this.langManager.getString('command_addimagetemplate_no_input_parameters'));
    }

    if (typeof this.parsedJsonConfig.input.width !== 'string' &&
        this.parsedJsonConfig.input.width > this.context.prefsManager.max_image_template_max_width) {
      throw new BotPublicError(this.langManager.getString('command_addimagetemplate_too_large_width',
        this.parsedJsonConfig.input.width, this.context.prefsManager.max_image_template_max_width));
    }

    if (typeof this.parsedJsonConfig.input.height !== 'string' &&
        this.parsedJsonConfig.input.height > this.context.prefsManager.max_image_template_max_height) {
      throw new BotPublicError(this.langManager.getString('command_addimagetemplate_too_large_height',
        this.parsedJsonConfig.input.height, this.context.prefsManager.max_image_template_max_height));
    }
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
    const existingTemplates = await this.context.dbManager.getRows(
      this.context.dbManager.imageTemplateTable,
      { orgId: this.orgId });

    if (existingTemplates.length >= this.context.prefsManager.max_image_templates_per_discord_org) {
      return this.langManager.getString(
        'command_addimagetemplate_too_many_image_templates',
        this.context.prefsManager.max_image_templates_per_discord_org
      );
    }

    const template = {
      id: this.templateName,
      orgId: this.orgId,
      source: this.source,
      config: this.parsedJsonConfig
    };

    const res = await this.context.dbManager.insertOne(this.context.dbManager.imageTemplateTable, template);
    if (res) {
      return this.langManager.getString(
        'command_addimagetemplate_success',
        this.templateName
      );
    } else {
      return this.langManager.getString(
        'command_addimagetemplate_error_not_unique_name',
        this.templateName
      );
    }
  }
}

/**
 * Exports the AddImageTemplateCommand class
 * @type {AddImageTemplateCommand}
 */
module.exports = AddImageTemplateCommand;

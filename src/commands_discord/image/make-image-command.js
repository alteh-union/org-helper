'use strict';

/**
 * @module make-image-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const ObjectArgScanner = require('../../arg_scanners/object-arg-scanner');
const SimpleArgScanner = require('../../arg_scanners/simple-arg-scanner');
const CommandArgDef = require('../../command_meta/command-arg-def');
const BotPublicError = require('../../utils/bot-public-error');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const MakeImageCommandArgDefs = Object.freeze({
  templateName: new CommandArgDef('templateName', {
    aliasIds: [
      'command_makeimage_arg_templateName_alias_templateName',
      'command_makeimage_arg_templateName_alias_n'
    ],
    helpId: 'command_makeimage_arg_templateName_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: true }
  }),
  imgUrl: new CommandArgDef('imgUrl', {
    aliasIds: [
      'command_makeimage_arg_imgUrl_alias_imgUrl',
      'command_makeimage_arg_imgUrl_alias_i'
    ],
    helpId: 'command_makeimage_arg_imgUrl_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: true }
  }),
  text: new CommandArgDef('text', {
    aliasIds: [
      'command_makeimage_arg_text_alias_text',
      'command_makeimage_arg_text_alias_t'
    ],
    helpId: 'command_makeimage_arg_text_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: true }
  }),
  style: new CommandArgDef('style', {
    aliasIds: [
      'command_makeimage_arg_style_alias_style',
      'command_makeimage_arg_style_alias_s'
    ],
    helpId: 'command_makeimage_arg_style_help',
    scanner: ObjectArgScanner,
    validationOptions: { nonNull: false }
  })
});

/**
 * Command to make an image based on a picture from URL and a template to add some watermarks,
 * stylish things and arbitrary title.
 * @alias MakeImageCommand
 * @extends DiscordCommand
 */
class MakeImageCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new MakeImageCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_makeimage_name';
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
    return langManager.getString('command_makeimage_help');
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return MakeImageCommandArgDefs;
  }

  /**
   * Validates each of the arguments according to validation types set in their definition.
   * Throws BotPublicError if any of the validations was violated.
   * @see CommandArgDef
   * @throws {BotPublicError}
   * @param  {BaseMessage}  message the command's message
   * @return {Promise}              nothing
   */
  async validateFromDiscord(message) {
    await super.validateFromDiscord(message);

    const res = await this.context.dbManager.getDiscordRows(this.context.dbManager.imageTemplateTable,
      this.orgId, { id: this.templateName });

    if (!res[0]) {
      throw new BotPublicError(
        this.langManager.getString(
          'command_makeimage_error_undefined_template',
          this.templateName
        )
      );
    }

    this.parsedJsonConfig = res[0].config;
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

    const params = {
      text: this.text ? this.text.replace(/^"(.*)"$/, '$1') : undefined,
      style: this.style
    };

    try {
      const imageResult = await this.context.imageGenerator.generateImage(this.imgUrl, params, this.parsedJsonConfig,
        this.source, this.orgId);
      const filePath = `images/${uuidv4()}.jpg`;
      imageResult.write(filePath);
      await message.originalMessage.channel.send(null, {
        files: [filePath]
      });

      await fs.unlink(filePath, (err) => {
        if (err) {
          this.context.log.e(`Failed to delete file ${filePath}. Error: ${err}`);
        }
      });

    } catch (e) {
      this.context.log.e(this.name + ': Cannot make image: ' + e.stack);
      return this.langManager.getString('command_makeimage_error_broken_template', this.templateName, e.message);
    }
  }
}


/**
 * Exports the MakeImageCommand class
 * @type {MakeImageCommand}
 */
module.exports = MakeImageCommand;

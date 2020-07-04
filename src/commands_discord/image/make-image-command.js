'use strict';

/**
 * @module image-generate
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const DiscordCommand = require('../discord-command');
const SimpleArgScanner = require('../../arg_scanners/simple-arg-scanner');
const CommandArgDef = require('../../command_meta/command-arg-def');
const BotPublicError = require('../../utils/bot-public-error');

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
    validationOptions: { nonNull: false }
  }),
  fontSize: new CommandArgDef('fontSize', {
    aliasIds: [
      'command_makeimage_arg_fontSize_alias_fontSize',
      'command_makeimage_arg_fontSize_alias_fs'
    ],
    helpId: 'command_makeimage_arg_fontSize_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: false }
  }),
  xShift: new CommandArgDef('xShift', {
    aliasIds: [
      'command_makeimage_arg_xShift_alias_xShift',
      'command_makeimage_arg_xShift_alias_x_shift'
    ],
    helpId: 'command_makeimage_arg_xShift_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: false }
  }),
  yShift: new CommandArgDef('yShift', {
    aliasIds: [
      'command_makeimage_arg_yShift_alias_yShift',
      'command_makeimage_arg_yShift_alias_y_shift'
    ],
    helpId: 'command_makeimage_arg_yShift_help',
    scanner: SimpleArgScanner,
    validationOptions: { nonNull: false }
  })
});

/**
 * MakeImage command.
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

  static getDefinedArgs() {
    return MakeImageCommandArgDefs;
  }

  /**
   * Executes the command instance. The main function of a command, it's essence.
   * All arguments scanning, validation and permissions check is considered done before entering this function.
   * So if any exception happens inside the function, it's considered a Bot's internal problem.
   * @param  {BaseMessage}         message the Discord message as the source of the command
   * @return {Promise<string>}                the result text to be replied as the response of the execution
   */
  async executeForDiscord(message) {
    // Inherited function with various possible implementations, some args may be unused.
    /* eslint no-unused-vars: ["error", { "args": "none" }] */

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
    const templateConfig = res[0].config;

    const params = {
      text: this.text ? this.text.replace(/^"(.*)"$/, '$1') : undefined,
      fontSize: this.fontSize,
      xShift: this.xShift,
      yShift: this.yShift
    };

    const imageResult = await this.context.imageGenerator.generateImage(this.imgUrl, params, templateConfig);
    imageResult.write('images/result.jpg');

    message.originalMessage.channel.send(null, {
      files: [
        'images/result.jpg'
      ]
    });
  }
}


/**
 * Exports the MakeImageCommand class
 * @type {MakeImageCommand}
 */
module.exports = MakeImageCommand;

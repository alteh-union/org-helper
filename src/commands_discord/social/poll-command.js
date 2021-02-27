'use strict';

/**
 * @module poll-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const Discord = require('discord.js');

const BotPublicError = require('../../utils/bot-public-error');

const DiscordCommand = require('../discord-command');
const CommandArgDef = require('../../command_meta/command-arg-def');
const QuotedSpaceArrayArgScanner = require('../../arg_scanners/quoted-space-array-arg-scanner');

const PollCommandArgDefs = Object.freeze({
  question: new CommandArgDef('question', {
    aliasIds: ['command_poll_arg_question_alias_question', 'command_poll_arg_question_alias_q'],
    helpId: 'command_poll_arg_question_help',
    validationOptions: { nonNull: true }
  }),
  answers: new CommandArgDef('answers', {
    aliasIds: ['command_poll_arg_answers_alias_answers', 'command_poll_arg_answers_alias_a'],
    helpId: 'command_poll_arg_answers_help',
    scanner: QuotedSpaceArrayArgScanner
  })
});

const NumericReactions = Object.freeze([
  '\u0031\u20E3',
  '\u0032\u20E3',
  '\u0033\u20E3',
  '\u0034\u20E3',
  '\u0035\u20E3',
  '\u0036\u20E3',
  '\u0037\u20E3',
  '\u0038\u20E3',
  '\u0039\u20E3',
  '\u0030\u20E3'
]);

const MaxAnswers = 10;

const POLL_POINT_SEPARATOR = '.';

/**
 * Command to set up a poll (yes/one or multi-answer).
 * @alias PollCommand
 * @extends DiscordCommand
 */
class PollCommand extends DiscordCommand {
  /**
   * Creates an instance for an organization from a source and assigns a given language manager to it.
   * @param  {Context}     context            the Bot's context
   * @param  {string}      source             the source name (like Discord etc.)
   * @param  {LangManager} commandLangManager the language manager
   * @param  {string}      orgId              the organization identifier
   * @return {Command}                        the created instance
   */
  static createForOrg(context, source, commandLangManager, orgId) {
    return new PollCommand(context, source, commandLangManager, orgId);
  }

  /**
   * Gets the text id of the command's name from localization resources.
   * @return {string} the id of the command's name to be localized
   */
  static getCommandInterfaceName() {
    return 'command_poll_name';
  }

  /**
   * Gets the array of all arguments definitions of the command.
   * @return {Array<CommandArgDef>} the array of definitions
   */
  static getDefinedArgs() {
    return PollCommandArgDefs;
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
    return langManager.getString('command_poll_help');
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

    if (this.answers !== null && this.answers.length > MaxAnswers) {
      throw new BotPublicError(
        this.langManager.getString('command_poll_too_many_answers', this.answers.length, MaxAnswers)
      );
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
    const pollEmbed = new Discord.MessageEmbed().setTitle(this.question);

    if (this.answers !== null && this.answers.length > 0) {
      let description = '';
      for (let i = 0; i < this.answers.length; i++) {
        description = description + (i + 1) + POLL_POINT_SEPARATOR + ' ' + this.answers[i] + '\n';
      }

      pollEmbed.setDescription(description);
    }

    const pollMessage = await message.originalMessage.channel.send(pollEmbed);

    if (this.answers !== null && this.answers.length > 0) {
      for (let i = 0; i < this.answers.length; i++) {
        // Must preserve the order of reactions, so ignoring the warning about parallel processing.
        /* eslint-disable no-await-in-loop */
        await pollMessage.react(NumericReactions[i]);
        /* eslint-enable no-await-in-loop */
      }
    } else {
      await pollMessage.react('👍');
      await pollMessage.react('👎');
    }

    await message.originalMessage.delete();
    return '';
  }
}

/**
 * Exports the PollCommand class
 * @type {PollCommand}
 */
module.exports = PollCommand;

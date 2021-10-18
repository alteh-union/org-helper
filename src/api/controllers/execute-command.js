'use strict';

/**
 * @module execute-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const DiscordCommandHandler = require('../command-handlers/discord-command-handler');

const LangManager = require('../../managers/lang-manager');
const BaseMessage = require('../../components/base-message');
const DiscordSource = require('../../components/discord-source');

const BotPublicError = require('../../utils/bot-public-error');

const BotTable = require('../../mongo_classes/bot-table');
const ServerSettingsTable = require('../../mongo_classes/server-settings-table');
const UserSettingsTable = require('../../mongo_classes/user-settings-table');

/**
 * Gets the most suitable language manager based on the organization and user preferences.
 * The process is mostly copied from the corresponding process of the standard Bot interface.
 * @see CommandsParser
 * @param  {Context}              context the Bot's context
 * @param  {string}               orgId   the identifier of the organization
 * @param  {string}               userId  the identifier of the user
 * @return {Promise<LangManager>}         the most suitable language manager
 */
const getCommandLangManager = async (context, orgId, userId) => {
  const currentLocale = await context.dbManager.getSetting(
    BotTable.DISCORD_SOURCE,
    orgId,
    ServerSettingsTable.SERVER_SETTINGS.localeName.name
  );

  const currentUserLocale = await context.dbManager.getUserSetting(
    BotTable.DISCORD_SOURCE,
    orgId,
    userId,
    UserSettingsTable.USER_SETTINGS.localeName.name
  );

  return new LangManager(
    context.localizationPath,
    currentUserLocale === undefined ? currentLocale : currentUserLocale
  );
};

/**
 * Parses a Discord command, including the arguments.
 * The process is mostly copied from the corresponding process of the standard Bot interface.
 * @see CommandsParser
 * @param  {Context}                     context            the Bot's context
 * @param  {BaseMessage}                 message            the command's message
 * @param  {constructor<DiscordCommand>} commandClass       the class of the command to be executed
 * @param  {Object}                      commandArgs        the arguments map
 * @param  {LangManager}                 commandLangManager the language manager
 * @return {Promise<DiscordCommand>}                        the Discord command instance or null if failed
 */
const tryParseDiscordCommand = async (context, message, commandClass, commandArgs, commandLangManager) => {
  const command = commandClass.createForOrg(context, message.source.name, commandLangManager, message.orgId);

  try {
    await command.parseFromDiscordWithArgs(message, commandArgs);
  } catch (error) {
    context.log.w(
      'tryParseDiscordCommandFromWeb: failed to parse command: "' +
        commandClass.getCommandInterfaceName() +
        '"; args: ' +
        require('util').inspect(commandArgs) +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack +
        (error.errorCode ? (';\nerrorCode: ' + error.errorCode) : '')
    );
    await message.reply(
      commandLangManager.getString(
        'validate_command_web_error',
        error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
      )
    );
    return null;
  }

  return command;
};

/**
 * Executes a Discord command after parsing the arguments and checking the user permissions according
 * to the supplied arguments.
 * The process is mostly copied from the corresponding process of the standard Bot interface.
 * @see CommandsParser
 * @param  {Context}                     context            the Bot's context
 * @param  {BaseMessage}                 message            the command's message
 * @param  {constructor<DiscordCommand>} commandClass       the class of the command to be executed
 * @param  {Object}                      commandArgs        the arguments map
 * @param  {LangManager}                 commandLangManager the language manager
 * @return {Promise}                                        nothing
 */
const executeDiscordCommand = async (context, message, commandClass, commandArgs, commandLangManager) => {
  const command = await tryParseDiscordCommand(context, message, commandClass, commandArgs, commandLangManager);
  if (command === null) {
    return;
  }

  try {
    await context.permManager.checkDiscordCommandPermissions(message, command);
  } catch (error) {
    context.log.w(
      'executeCommandFromWeb: Not permitted to execute: "' +
        commandClass.getCommandInterfaceName() +
        '"; args: ' +
        require('util').inspect(commandArgs) +
        '; Error message: ' +
        error +
        '; stack: ' +
        error.stack
    );
    await message.reply(
      commandLangManager.getString(
        'permission_command_error',
        error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
      )
    );
    return;
  }

  let result;
  try {
    result = await command.executeForDiscord(message);
  } catch (error) {
    context.log.w(
      'executeCommandFromWeb: failed to execute command: "' +
        commandClass.getCommandInterfaceName() +
        '"; args: ' +
        require('util').inspect(commandArgs) +
        '"; Error message: ' +
        error +
        '; stack: ' +
        error.stack
    );
    await message.reply(
      commandLangManager.getString(
        'execute_command_error',
        error instanceof BotPublicError ? error.message : commandLangManager.getString('internal_server_error')
      )
    );
    return;
  }

  if (result !== undefined && result !== null && result !== '') {
    await message.reply(result);
  }
};

/**
 * Executes a command issued by the user. Performs all necessary validations before that:
 * checks the JWT token of the user, checks if the user, the corresponsing organization and command exist,
 * launch the standard argument validation.
 * The result maybe complex, and include not only the standard text response, but also attachment files
 * and suggestions for argument inputs.
 * The process is mostly copied from the corresponding process of the standard Bot interface.
 * @see CommandsParser
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
const executeCommand = async (req, res, next) => {
  try {
    if (req.headers && req.headers.authorization) {
      const context = req.app.get('context');

      const authorization = req.headers.authorization.split(' ')[1];
      let decoded;
      try {
        decoded = jwt.verify(authorization, context.prefsManager.jwt_secret);
      } catch (e) {
        return res.status(401).send('Unauthorized');
      }

      var userId = decoded.sub;
      const users = context.dbManager.dbo.collection('users');
      const searchCriteria = { '_id': new ObjectId(userId) };
      const user = await users.findOne(searchCriteria);
      if (!user) {
        return res.status(401).send('Unauthorized');
      }

      const orgId = req.body.orgId;
      if (!orgId) {
        return res.status(400).send('Missing org id');
      }
      const orgsArray = context.discordClient.guilds.cache.array();
      const selectedOrg = orgsArray.find(s => s.id === orgId);
      if (!selectedOrg) {
        return res.status(400).send('Wrong org id provided');
      }

      const commandName = req.body.command;
      if (!commandName) {
        return res.status(400).send('Missing command name');
      }

      const commandDefinition = new DiscordCommandHandler().getCommandByName(commandName);
      if (!commandDefinition) {
        return res.status(400).send('Wrong command name');
      }

      let commandArgs = null;

      try {
        commandArgs = JSON.parse(req.body.payload);
      } catch (e) {
        commandArgs = req.body.payload;
      }

      const discordUserId = user.discordInfo.id;
      const commandLangManager = await getCommandLangManager(context, orgId, discordUserId);

      const member = await selectedOrg.members.fetch(discordUserId);

      const source = new DiscordSource(context.discordClient);
      const fakeOriginalMessage = {
        guild: selectedOrg,
        member: member
      };
      const message = new BaseMessage(orgId, null, discordUserId, '', fakeOriginalMessage, source);

      context.scheduler.syncTasks();
      await executeDiscordCommand(context, message, commandDefinition, commandArgs, commandLangManager);

      res.status(200).send({ commandResult: { text: message.replyResult.text,
        attachments: message.replyResult.attachments, suggestions: message.replyResult.suggestions } });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Exports the functions to handle command-related web-endpoints for UI clients.
 */
module.exports = {
  executeCommand
};

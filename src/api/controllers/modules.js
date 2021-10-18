'use strict';

/**
 * @module modules
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const DiscordCommandHandler = require('../command-handlers/discord-command-handler');

const LangManager = require('../../managers/lang-manager');

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
 * Gets the list of command modules (groups) available for the user in the given organization.
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
const getUserModules = async (req, res, next) => {
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

      const orgId = req.query.orgId;
      if (!orgId) {
        return res.status(400).send('Missing org id');
      }

      const discordUserId = user.discordInfo.id;
      const langManager = await getCommandLangManager(context, orgId, discordUserId);

      const completeModules = new DiscordCommandHandler().definedModules;

      const filteredModules = [];
      for (const commandModule of completeModules) {
        filteredModules.push({
          id: commandModule.name,
          name: langManager.getString(commandModule.displayName),
          icon: commandModule.icon
        });
      }

      res.status(200).send({ commandModules: filteredModules });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Gets the detailed module definition for the given organization.
 * This includes all the commands in the module as well as argument details.
 * @param  {Request}  req  the express object representing the web-request to this endpoint
 * @param  {Response} res  the express object representing the web-response from this endpoint
 * @param  {Function} next the callback function to the next middleware in the express stack
 */
const getModuleDefinition = async (req, res, next) => {
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

      const orgId = req.query.orgId;
      if (!orgId) {
        return res.status(400).send('Missing org id');
      }

      const moduleId = req.query.moduleId;
      if (!moduleId) {
        return res.status(400).send('Missing module id');
      }

      const completeModules = new DiscordCommandHandler().definedModules;

      const selectedModule = completeModules.find(m => m.name === moduleId);

      if (!selectedModule) {
        return res.status(400).send('Could not find selected module');
      }

      const discordUserId = user.discordInfo.id;
      const langManager = await getCommandLangManager(context, orgId, discordUserId);

      const moduleDefinition = {};
      moduleDefinition.id = selectedModule.name;
      moduleDefinition.name = langManager.getString(selectedModule.displayName);

      moduleDefinition.commands = [];
      for (const command of selectedModule.commands) {
        const commandDefinition = {};
        commandDefinition.name = command.getCommandInterfaceName();
        commandDefinition.displayName = langManager.getString(command.DISPLAY_NAME);
        commandDefinition.help = command.getHelpText(context, langManager);

        const argDefinitions = [];
        const definedArgs = command.getDefinedArgs();
        for (const argName in definedArgs) {
          if (Object.prototype.hasOwnProperty.call(definedArgs, argName)) {
            const arg = definedArgs[argName];
            const argDefinition = {};
            argDefinition.scannerType = arg.scanner.getUiType();
            argDefinition.name = arg.name;
            argDefinition.displayName = langManager.getString(arg.aliasIds[0]);
            argDefinition.help = langManager.getString(arg.helpId);
            argDefinitions.push(argDefinition);
          }
        }

        commandDefinition.args = argDefinitions;

        moduleDefinition.commands.push(commandDefinition);
      }

      res.status(200).send({ moduleDefinition: moduleDefinition });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Exports the functions to handle module-related web-endpoints for UI clients.
 */
module.exports = {
  getUserModules,
  getModuleDefinition
};

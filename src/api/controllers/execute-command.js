'use strict';

/**
 * @module execute-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const DiscordCommandHandler = require('../command-handlers/discord-command-handler');

const BaseMessage = require('../../components/base-message');
const DiscordSource = require('../../components/discord-source');

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

      const commandHandler = new DiscordCommandHandler();
      const commandDefinition = commandHandler.getCommandByName(commandName);
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
      const commandLangManager = await commandHandler.getCommandLangManager(context, orgId, discordUserId);

      const member = await selectedOrg.members.fetch(discordUserId);

      const source = new DiscordSource(context.discordClient);
      const fakeOriginalMessage = {
        guild: selectedOrg,
        member: member
      };
      const message = new BaseMessage(orgId, null, discordUserId, '', fakeOriginalMessage, source);

      context.scheduler.syncTasks();
      await commandHandler.executeCommand(context, message, commandDefinition, commandArgs, commandLangManager);

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

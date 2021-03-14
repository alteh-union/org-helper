const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const DiscordCommandHandler = require('../command-handlers/discord-command-handler');

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

      const serverId = req.query.serverId;
      if (!serverId) {
        return res.status(400).send('Missing server id');
      }

      const completeModules = new DiscordCommandHandler().definedModules;

      const filteredModules = [];
      for (const commandModule of completeModules) {
        filteredModules.push({
          id: commandModule.name,
          name: context.langManager.getString(commandModule.displayName),
          icon: commandModule.icon
        });
      }

      res.status(200).send({ commandModules: filteredModules });
    }
  } catch (error) {
    next(error);
  }
};

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

      const serverId = req.query.serverId;
      if (!serverId) {
        return res.status(400).send('Missing server id');
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

      const moduleDefinition = {};
      moduleDefinition.id = selectedModule.name;
      moduleDefinition.name = context.langManager.getString(selectedModule.displayName);

      moduleDefinition.commands = [];
      for (const command of selectedModule.commands) {
        const commandDefinition = {};
        commandDefinition.name = command.getCommandInterfaceName();
        commandDefinition.displayName = context.langManager.getString(command.DISPLAY_NAME);
        commandDefinition.help = command.getHelpText(context, context.langManager);

        const argDefinitions = [];
        const definedArgs = command.getDefinedArgs();
        for (const argName in definedArgs) {
          if (Object.prototype.hasOwnProperty.call(definedArgs, argName)) {
            const arg = definedArgs[argName];
            console.log(require('util').inspect(arg));
            const argDefinition = {};
            argDefinition.scannerType = arg.scanner.getWebUiType();
            argDefinition.name = arg.name;
            argDefinition.displayName = context.langManager.getString(arg.aliasIds[0]);
            argDefinition.help = context.langManager.getString(arg.helpId);
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

module.exports = {
  getUserModules,
  getModuleDefinition
};

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

const getCommandLangManager = async (context, serverId, userId) => {
  const currentLocale = await context.dbManager.getSetting(
    BotTable.DISCORD_SOURCE,
    serverId,
    ServerSettingsTable.SERVER_SETTINGS.localeName.name
  );

  const currentUserLocale = await context.dbManager.getUserSetting(
    BotTable.DISCORD_SOURCE,
    serverId,
    userId,
    UserSettingsTable.USER_SETTINGS.localeName.name
  );

  return new LangManager(
    context.localizationPath,
    currentUserLocale === undefined ? currentLocale : currentUserLocale
  );
};

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

      const serverId = req.body.serverId;
      if (!serverId) {
        return res.status(400).send('Missing server id');
      }
      const serversArray = context.discordClient.guilds.cache.array();
      const selectedServer = serversArray.find(s => s.id === serverId);
      if (!selectedServer) {
        return res.status(400).send('Wrong server id provided');
      }

      const commandName = req.body.command;
      if (!commandName) {
        return res.status(400).send('Missing command name');
      }

      const commandDefinition = new DiscordCommandHandler().getCommandByName(commandName);
      if (!commandDefinition) {
        return res.status(400).send('Wrong command name');
      }

      const commandArgs = JSON.parse(req.body.payload);

      const discordUserId = user.discordInfo.id;
      const commandLangManager = await getCommandLangManager(context, serverId, discordUserId);

      const source = new DiscordSource(context.discordClient);
      const message = new BaseMessage(serverId, null, discordUserId, '', null, source);

      context.scheduler.syncTasks();
      await executeDiscordCommand(context, message, commandDefinition, commandArgs, commandLangManager);

      res.status(200).send({ commandResult: { text: message.replyBuffer } });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  executeCommand
};

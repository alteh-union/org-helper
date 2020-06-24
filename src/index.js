'use strict';

/**
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

console.log('OrgHelper startup');

const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const Discord = require('discord.js');

const OhUtils = require('./utils/bot-utils');
const BaseMessage = require('./components/base-message');
const PrefsManager = require('./managers/prefs-manager');
const Context = require('./managers/context');
const DiscordSource = require('./components/discord-source');
const prefsPath = path.join(__dirname, '..', 'preferences.txt');
const localizationPath = path.join(__dirname, '..', 'localization');

const client = new Discord.Client();

const prefsManager = new PrefsManager(prefsPath);


prefsManager.readPrefs();

const c = new Context(prefsManager, localizationPath, client);
const discordSource = new DiscordSource(client);

c.log.i('Context created.');

let exceptionOccured = false;

const dbConnectionString = OhUtils.makeDbConnectionString(prefsManager);
if (dbConnectionString === '') {
  const exitText = 'dbConnectionString is empty. Looks like DB preferences are missing. Aborting.';
  c.log.f(exitText);
  throw new Error(exitText);
}

MongoClient.connect(dbConnectionString, async (err, db) => {
  if (err) {
    throw err;
  }

  await c.dbManager.setDbo(db.db(c.prefsManager.db_name));

  process.on('uncaughtException', err => {
    const exitText = 'Uncaught exception: ' + err + '; stack:' + err.stack;
    c.log.f(exitText);
    exceptionOccured = true;
    throw new Error(exitText);
  });

  process.on('exit', code => {
    if (exceptionOccured) {
      c.log.i('Exception occured. Exiting. Code: ' + code);
    } else {
      c.log.f('Kill signal received. Code: ' + code);
    }

    db.close();
  });

  client.on('ready', async () => {
    try {
      c.log.i('Servers:');
      const guildsArray = client.guilds.cache.array();
      const updateResults = [];
      for (const guild of guildsArray) {
        c.log.i(' - ' + guild.name);
        updateResults.push(c.dbManager.updateGuild(guild));
      }

      await Promise.all(updateResults);

      c.commandsParser.setDiscordClient(client);
      c.messageModerator.setDiscordClient(client);

      await c.dbManager.updateGuilds(client.guilds.cache);

      c.discordClientReady = true;

      await c.scheduler.syncTasks();
    } catch (error) {
      c.log.f('client on ready error: ' + error + '; stack: ' + error.stack);
    }
  });

  client.on('message', async discordMessage => {
    if (!c.discordClientReady) {
      c.log.w('on message: the client is not ready');
      return;
    }


    try {
      const message = BaseMessage.createFromDiscord(discordMessage, discordSource);
      await c.dbManager.updateGuilds(client.guilds.cache);
      await c.scheduler.syncTasks();

      // TODO: Is it discord only feature?
      if (message.originalMessage.guild !== undefined && message.originalMessage.guild !== null) {
        await c.dbManager.updateGuild(message.originalMessage.guild);

        let processed = false;
        if (message.userId !== client.user.id) {
          processed = await c.commandsParser.processMessage(message);
          if (!processed) {
            c.messageModerator.premoderateDiscordMessage(message);
          }
        }
      } else {
        // The null guild means it's a private ("DM") message
        await c.commandsParser.parsePrivateDiscordCommand(message);
      }
    } catch (error) {
      c.log.e('client on message error: ' + error + '; stack: ' + error.stack);
    }
  });

  client.login(c.prefsManager.discord_token);
});

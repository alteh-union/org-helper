'use strict';

/**
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

console.log('OrgHelper startup');

const InitApiServer = require('./api/init-api').initApi;

const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const Discord = require('discord.js');
const { Telegraf } = require('telegraf');

const OhUtils = require('./utils/bot-utils');
const BaseMessage = require('./components/base-message');
const PrefsManager = require('./managers/prefs-manager');
const Context = require('./managers/context');
const DiscordSource = require('./components/discord-source');
const TelegramSource = require('./components/telegram-source');
const prefsPath = path.join(__dirname, '..', 'preferences.txt');
const localizationPath = path.join(__dirname, '..', 'localization');

const prefsManager = new PrefsManager(prefsPath);

prefsManager.readPrefs();

const discordClient = new Discord.Client();
const telegramClient = new Telegraf(prefsManager.telegram_token);

const c = new Context(prefsManager, localizationPath, discordClient, telegramClient);
const discordSource = new DiscordSource(discordClient);
const telegramSource = new TelegramSource(telegramClient);

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

  // Initialise api-server for the web interface
  InitApiServer(c);

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

    if (telegramClient) {
      telegramClient.stop();
    }

    db.close();
  });

  discordClient.on('ready', async () => {
    try {
      c.log.i('Servers:');
      const guildsArray = discordClient.guilds.cache.array();
      const updateResults = [];
      for (const guild of guildsArray) {
        c.log.i(' - ' + guild.name);
        updateResults.push(c.dbManager.updateGuild(guild));
      }

      await Promise.all(updateResults);
      await c.dbManager.updateGuilds(discordClient.guilds.cache);

      c.discordClientReady = true;

      await c.scheduler.syncTasks();
    } catch (error) {
      c.log.f('discordClient on ready error: ' + error + '; stack: ' + error.stack);
    }
  });

  discordClient.on('message', async discordMessage => {
    if (!c.discordClientReady) {
      c.log.w('on message: the discordClient is not ready');
      return;
    }

    try {
      const message = BaseMessage.createFromDiscord(discordMessage, discordSource);

      if (message.originalMessage.guild !== undefined && message.originalMessage.guild !== null) {
        let processed = false;
        if (message.userId !== discordClient.user.id) {
          processed = await c.commandsParser.processMessage(message);
          if (!processed) {
            c.messageModerator.premoderateDiscordMessage(message);
          }
        }
      } else {
        // The null guild means it's a private ("DM") message
        await c.commandsParser.processPrivateMessage(message);
      }
    } catch (error) {
      c.log.e('discordClient on message error: ' + error + '; stack: ' + error.stack);
    }
  });

  discordClient.login(c.prefsManager.discord_token);

  telegramClient.on('message', async ctx => {
    try {
      const message = BaseMessage.createFromTelegram(ctx, telegramSource);
      await c.commandsParser.processMessage(message);
    } catch (error) {
      c.log.e('telegramClient on message error: ' + error + '; stack: ' + error.stack);
    }
  });

  telegramClient.launch();
});

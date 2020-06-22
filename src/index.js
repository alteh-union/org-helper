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

const PrefsManager = require('./managers/prefs-manager');
const Context = require('./managers/context');

const DiscordModule = require('./discord-module');
const SlackModule = require('./slack-module');

const prefsPath = path.join(__dirname, '..', 'preferences.txt');
const localizationPath = path.join(__dirname, '..', 'localization');

const client = new Discord.Client();

const prefsManager = new PrefsManager(prefsPath);

prefsManager.readPrefs();

const c = new Context(prefsManager, localizationPath, client);
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

  (new DiscordModule(c)).run();
  (new SlackModule(c)).run();
  /**
   * Slack Integration
   */


});

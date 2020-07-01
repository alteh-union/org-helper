'use strict';

/**
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

console.log('OrgHelper E2E test startup');

const path = require('path');
const Discord = require('discord.js');

const prefsPath = path.join(__dirname, '..', 'preferences.txt');
const PrefsManager = require('./managers/prefs-manager');
const prefsManager = new PrefsManager(prefsPath);
prefsManager.readPrefs();

const TestCaseAddress = require('./components/test-case-address');

const selectedTestCases = [];

process.argv.forEach(function (val, index, array) {
  // the first 2 args are "node" and this index file, so skipping them.
  if (index > 1) {
    console.log('Test case arg at index ' + index + ': ' + val);
    const parts = val.split('/');
    let testCaseAddress = null;
    if (parts.length === 1) {
      testCaseAddress = new TestCaseAddress(parts[0]);
    } else if (parts.length === 2) {
      testCaseAddress = new TestCaseAddress(parts[0], parts[1]);
    } else {
      return;
    }
    selectedTestCases.push(testCaseAddress);
  }
});

const suitsPath = path.join(__dirname, 'suits');
const CasesManager = require('./managers/cases-manager');
const casesManager = new CasesManager(suitsPath, selectedTestCases);

const ResultsManager = require('./managers/results-handler');
const resultsHandler = new ResultsManager(path.join(__dirname, prefsManager.test_results_file_path));

const discordClient = new Discord.Client();

const Processor = require('./managers/processor');
const processor = new Processor(prefsManager, casesManager, resultsHandler, { discord: discordClient });

if (!prefsManager.isNullOrTemplate(prefsManager.test_discord_token)) {
  processor.addSourceWaiter();

  discordClient.on('ready', async () => {
    processor.onSourceReady();
  });

  discordClient.on('message', async discordMessage => {
    const currentCase = processor.casesManager.selectedCases[processor.currentCaseIndex];
    if (currentCase !== undefined && currentCase !== null) {
      currentCase.onDiscordReply(discordMessage);
    }
  });

  discordClient.login(prefsManager.test_discord_token);
}

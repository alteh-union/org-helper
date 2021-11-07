'use strict';

/**
 * @module init-api
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const express = require('express');
const app = express();
const auth = require('./routes/auth');
const orgs = require('./routes/orgs');
const modules = require('./routes/modules');
const executeCommand = require('./routes/execute-command');
const suggestions = require('./routes/suggestions');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const OhUtils = require('../utils/bot-utils');
const MongoClient = require('mongodb');

/**
 * Initializes the Web API to be used by UI clients.
 * Uses the DB as the main part of the Bot. Adds the stack of necessary express middleware.
 * @param {Context} c the Bot's context
 */
function initApi(c) {
  const dbConnectionString = OhUtils.makeDbConnectionString(c.prefsManager);
  if (dbConnectionString === '') {
    const exitText = 'dbConnectionString is empty. Looks like DB preferences are missing. Aborting.';
    c.log.f(exitText);
    throw new Error(exitText);
  }

  MongoClient.connect(dbConnectionString, async (err, db) => {
    if (err) {
      throw err;
    }

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(cors());
    app.use(jwt(c));

    app.set('context', c);

    app.use('/auth', auth);
    app.use('/orgs', orgs);
    app.use('/modules', modules);
    app.use('/commands', executeCommand);
    app.use('/suggestions', suggestions);

    app.use(errorHandler);

    app.listen(c.prefsManager.server_port, function () {
      c.log.i('Api-Server is running on port: ' + c.prefsManager.server_port);
    });
  });
}

/**
 * Exports the API initialization function.
 */
module.exports = {
  initApi
};

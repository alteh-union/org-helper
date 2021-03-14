const express = require('express');
const app = express();
const auth = require('./routes/auth');
const servers = require('./routes/servers');
const modules = require('./routes/modules');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
const OhUtils = require('../utils/bot-utils');
const MongoClient = require('mongodb');

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

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(cors());
    app.use(jwt(c));

    app.set('context', c);

    app.use('/auth', auth);
    app.use('/servers', servers);
    app.use('/modules', modules);

    app.use(errorHandler);

    app.listen(c.prefsManager.server_port, function () {
      console.log('Api-Server is running on port: ' + c.prefsManager.server_port);
    });
  });
}

module.exports = {
  initApi
};

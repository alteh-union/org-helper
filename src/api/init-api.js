const express = require('express');
const app = express();
const auth = require('./routes/auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

function initApi(c) {
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cors());
  app.use(jwt(c));

  app.set('context', c);

  app.use('/auth', auth);
  app.use('/users', require('./users/users.controller'));

  app.use(errorHandler);

  app.listen(c.prefsManager.server_port, function () {
    console.log('Api-Server is running on port: ' + c.prefsManager.server_port);
  });
}

module.exports = {
  initApi
};

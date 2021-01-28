const express = require('express');
const app = express();
const auth = require('./routes/auth');
// const roles = require('./routes/roles');
const cors = require('cors');

function initApi(c) {
  app.use(cors());
  app.listen(c.prefsManager.server_port, function () {
    console.log('Api-Server is running on port: ' + c.prefsManager.server_port);
  });

  app.set('context', c);

  app.use('/auth', auth);
  // app.use('/roles', roles);
}

module.exports = {
  initApi
};

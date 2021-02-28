const express = require('express');
const servers = express.Router();
const serversController = require('../controllers/servers');

servers.get('/discord/get-servers', serversController.getUserServers);

module.exports = servers;

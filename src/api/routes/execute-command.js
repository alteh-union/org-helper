const express = require('express');
const modules = express.Router();
const multer  = require('multer');
const upload = multer();
const commandController = require('../controllers/execute-command');

modules.post('/discord/execute-command', upload.none(), commandController.executeCommand);

module.exports = modules;

'use strict';

/**
 * @module execute-command
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const express = require('express');
const modules = express.Router();
const multer  = require('multer');
const upload = multer();
const commandController = require('../controllers/execute-command');

modules.post('/discord/execute-command', upload.none(), commandController.executeCommand);

/**
 * Exports the express router for handling command-related requests from UI clients.
 */
module.exports = modules;

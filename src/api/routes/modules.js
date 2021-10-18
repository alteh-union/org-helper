'use strict';

/**
 * @module modules
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const express = require('express');
const modules = express.Router();
const modulesController = require('../controllers/modules');

modules.get('/discord/get-modules', modulesController.getUserModules);
modules.get('/discord/get-module', modulesController.getModuleDefinition);

/**
 * Exports the express router for handling module-related requests from UI clients.
 */
module.exports = modules;

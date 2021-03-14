const express = require('express');
const modules = express.Router();
const modulesController = require('../controllers/modules');

modules.get('/discord/get-modules', modulesController.getUserModules);
modules.get('/discord/get-module', modulesController.getModuleDefinition);

module.exports = modules;

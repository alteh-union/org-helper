'use strict';

/**
 * @module orgs
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const express = require('express');
const orgs = express.Router();
const orgsController = require('../controllers/orgs');

orgs.get('/discord/get-orgs', orgsController.getUserOrgs);

/**
 * Exports the express router for handling org-related requests from UI clients.
 */
module.exports = orgs;

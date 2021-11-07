'use strict';

/**
 * @module suggestions
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const express = require('express');
const suggestions = express.Router();
const suggestionsController = require('../controllers/suggestions');

suggestions.post('/discord/get-suggestions', suggestionsController.getSuggestions);

/**
 * Exports the express router for handling suggestions-related requests from UI clients.
 */
module.exports = suggestions;

'use strict';

/**
 * @module bot-public-error
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE.md file for details)
 */

/**
 * Represents an exception which was caused by the user, so should be communicated back to him.
 * @alias BotPublicError
 * @extends Error
 */
class BotPublicError extends Error {}

/**
 * Exports the BotPublicError class
 * @type {BotPublicError}
 */
module.exports = BotPublicError;

'use strict';

/**
 * @module assertion-error
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Represents an exception which was raised during a test case execution as a result of failed assertion.
 * The class is needed to distinguish the assertion errors from other unexpected errors (which may be
 * caused by internal problems in the E2E tests source code or misconfiguration).
 * @alias AssertionError
 * @extends Error
 */
class AssertionError extends Error {}

/**
 * Exports the AssertionError class
 * @type {AssertionError}
 */
module.exports = AssertionError;

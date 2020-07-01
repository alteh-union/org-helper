'use strict';

/**
 * @module test-result
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Represents a result of a single test case.
 * @alias TestResult
 */
class TestResult {
  /**
   * Initializes the result
   * @see ResultsHandler
   * @param {TestSuit} testCaseName the name of the test case
   * @param {Object}   resultType   the type of the result (like passed, failed etc.)
   * @param {Date}     timestamp    the timestamp of the result
   * @param {Error}    exception    the exception related to the failure (undefined in case of success)
   */
  constructor(testCaseName, resultType, timestamp, exception) {
    this.testCaseName = testCaseName;
    this.resultType = resultType;
    this.timestamp = timestamp;
    this.exception = exception;
  }
}

/**
 * Exports the TestResult class
 * @type {TestResult}
 */
module.exports = TestResult;

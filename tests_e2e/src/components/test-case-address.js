'use strict';

/**
 * @module test-case-address
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

/**
 * Represents an address of a test case: the test suit name and the case name.
 * @alias TestCaseAddress
 */
class TestCaseAddress {
  constructor(testSuitName, testCaseName) {
    this.testSuitName = testSuitName;
    if (this.testSuitName === undefined) {
      this.testSuitName = null;
    }

    if (testCaseName !== undefined && testCaseName !== null && this.testSuitName === null) {
      throw new Error('Cannot use particular test case with no suit provided.');
    } else {
      this.testCaseName = testCaseName;
    }

    if (this.testCaseName === undefined) {
      this.testCaseName = null;
    }
  }
}

/**
 * Exports the TestCaseAddress class
 * @type {TestCaseAddress}
 */
module.exports = TestCaseAddress;

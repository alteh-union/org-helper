'use strict';

/**
 * @module test-suit
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const fs = require('fs');
const path = require('path');

const TestCase = require('./test-case');

/**
 * Represents a test suit consisting of some test cases (typically covering some theme of feature).
 * @alias TestSuit
 */
class TestSuit {
  /**
   * Constructs an instance of the suit from the given folder
   * @param {CasesManager} casesManager the manager of test suites
   * @param {string}       suitPath     the path to this particulat test suit
   */
  constructor(casesManager, suitPath) {
    this.casesManager = casesManager;
    this.suitPath = suitPath;
    this.name = path.basename(suitPath);
    this.cases = [];

    const casesFiles = fs.readdirSync(this.suitPath, { withFileTypes: true })
      .filter(fileEntity => !fileEntity.isDirectory())
      .map(fileEntity => fileEntity.name);

    for (const caseFile of casesFiles) {
      const TestCaseClass = require(path.join(suitPath, caseFile));
      const testCase = new TestCaseClass(this, caseFile);
      if (testCase instanceof TestCase) {
        this.cases.push(testCase);
      }
    }
  }

  /**
   * Returns the name of the suit
   * @return {string} the name of the suit (the same as the folder name)
   */
  getName() {
    return this.name;
  }

  /**
   * Gets the count of defined cases in the test suit
   * @return {Number} the count of test cases
   */
  getTestsCount() {
    return this.cases.length;
  }

  /**
   * Returns the array of test cases belonging to the suit
   * @return {Array<TestCase>} the test cases
   */
  getCases() {
    return this.cases;
  }

  /**
   * Gets the test case object by the name of the case (belonging to this suit)
   * @param  {string}   name   the name of the test case (the case as the file name without .js extension)
   * @return {TestCase}        the test case
   */
  getCase(name) {
    for (const testCase of this.cases) {
      if (testCase.getName() === name) {
        return testCase;
      }
    }
    return null;
  }
}

/**
 * Exports the TestSuit class
 * @type {TestSuit}
 */
module.exports = TestSuit;

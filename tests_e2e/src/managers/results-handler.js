'use strict';

/**
 * @module results-handler
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const fs = require('fs');

const ResultType = Object.freeze({
  passed: 'passed',
  failed: 'failed',
  failedInternal: 'failedInternal'
});

/**
 * Adds test results to the results file.
 * @alias ResultsHandler
 */
class ResultsHandler {
  /**
   * Constructs an instance of the class
   * @param {string} filePath     the path to the output file
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.logFile = fs.createWriteStream(filePath, { flags: 'a' });
    this.results = [];
  }

  static get RESULT_TYPE() {
    return ResultType;
  }

  /**
   * Prints info that a test session is started
   * @param  {Array<TestCase>} selectedCases the array of selected test cases to be executed
   */
  printTestsStart(selectedCases) {
    const date = new Date();
    this.printString(date.toISOString() + ': E2E tests start.');
    this.printString('Test cases to be executed: ' + selectedCases.length + '; in suits: '
      + new Set(selectedCases.map(testCase => testCase.suit.getName())).size);
  }

  /**
   * Prints info about starting a test case
   * @param  {string} caseName the test case name
   */
  printCaseStart(caseName) {
    this.printString(new Date().toISOString() + ': starting test ' + caseName);
  }

  /**
   * Prints a test result.
   * @param  {TestResult} testResult  the test result
   */
  printResult(testResult) {
    this.results.push(testResult);

    this.printString(testResult.timestamp.toISOString() + ': test case ' + testResult.testCaseName
      + ' is ' + testResult.resultType + (testResult.resultType === ResultType.passed ?
      '' : (' with exception: ' + testResult.exception.message + '; stack: ' + testResult.exception.stack)));
  }

  /**
   * Prints info that a test session is finished and summarizes the results
   */
  printTestsEnd() {
    const date = new Date();
    this.printString(date.toISOString() + ': E2E tests end.');
    this.printString('Passed cases: ' + this.results.filter(r => r.resultType === ResultType.passed).length);
    this.printString('Failed cases: ' + this.results.filter(r => r.resultType === ResultType.failed).length);
    this.printString('Internally failed cases: '
      + this.results.filter(r => r.resultType === ResultType.failedInternal).length);
    this.printString('Total cases: ' + this.results.length);
    this.printString('');
    this.printString('==========================================================');
    this.printString('');
  }

  /**
   * Prints the string into the file (and copies the message to the console as well).
   * @param  {string} text the text string to be printed
   */
  printString(text) {
    console.log(text);
    this.logFile.write(text + '\n');
  }

  /**
   * Closes the output file stream
   */
  close() {
    this.logFile.close();
  }
}

/**
 * Exports the ResultsHandler class
 * @type {ResultsHandler}
 */
module.exports = ResultsHandler;

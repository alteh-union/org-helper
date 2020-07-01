'use strict';

/**
 * @module processor
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const ResultsHandler = require('./results-handler');
const AssertionError = require('../components/assertion-error');
const TestResult = require('../components/test-result');

/**
 * Manages the list of test suits.
 * @alias Processor
 */
class Processor {
  /**
   * Constructs an instance of the class
   * @param {PrefsManager}    prefsManager    the preferences manager
   * @param {CasesManager}    casesManager    the test cases manager
   * @param {ResultsGHandler} resultsHandler  the test results handler
   * @param {Object}          sourceClients   the object containing particular source/platform client objects
   */
  constructor(prefsManager, casesManager, resultsHandler, sourceClients) {
    this.prefsManager = prefsManager;
    this.casesManager = casesManager;
    this.casesManager.setProcessor(this);
    this.resultsHandler = resultsHandler;
    if (sourceClients.discord !== undefined) {
      this.discordClient = sourceClients.discord;
    }
    this.sourcesBeingWaitedFor = 0;
    this.sourcesReady = 0;
  }

  /**
   * Increments the count of source/platform components to be waited for initialization before starting the tests
   */
  addSourceWaiter() {
    this.sourcesBeingWaitedFor++;
  }

  /**
   * Handles a "source client ready" event (for example, when a Discord bot is ready).
   * Launches the tests if all waited source clients are ready.
   */
  onSourceReady() {
    this.sourcesReady++;
    if (this.sourcesReady === this.sourcesBeingWaitedFor) {
      this.executeTests();
    }
  }

  /**
   * Executes the selected test cases
   */
  async executeTests() {
    this.currentCaseIndex = 0;
    this.resultsHandler.printTestsStart(this.casesManager.selectedCases);
    while (this.currentCaseIndex < this.casesManager.selectedCases.length) {
      await this.executeCurrentCase();
      this.currentCaseIndex++;
    }
    this.resultsHandler.printTestsEnd();
    this.resultsHandler.close();
    // grace period to allow ResultHandler to finish writing the file
    setTimeout(onEnd => {
      process.exit();
    }, 1000);
  }

  /**
   * Executes the current test case
   * @return {Promise} nothing
   */
  async executeCurrentCase() {
    let resultType = ResultsHandler.RESULT_TYPE.passed;
    let exception = null;
    let currentCase = null;
    try {
      currentCase = this.casesManager.selectedCases[this.currentCaseIndex];
      this.resultsHandler.printCaseStart(currentCase.getName());
      await currentCase.execute();
    } catch (e) {
      if (e instanceof AssertionError) {
        resultType = ResultsHandler.RESULT_TYPE.failed;
      } else {
        resultType = ResultsHandler.RESULT_TYPE.failedInternal;
      }
      exception = e;
    }
    const result = new TestResult(currentCase.getName(), resultType, new Date(), exception);

    this.resultsHandler.printResult(result);
  }
}

/**
 * Exports the Processor class
 * @type {Processor}
 */
module.exports = Processor;

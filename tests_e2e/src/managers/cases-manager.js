'use strict';

/**
 * @module cases-manager
 * @author Alteh Union (alteh.union@gmail.com)
 * @license MIT (see the root LICENSE file for details)
 */

const fs = require('fs');
const path = require('path');

const TestSuit = require('../components/test-suit');

/**
 * Manages the list of test suits.
 * @alias CasesManager
 */
class CasesManager {
  /**
   * Constructs an instance of the class
   * @param {string}                 suitsPath         the path to the suits definitions on the file system
   * @param {Array<TestCaseAddress>} selectedAddresses the list of selected suit names to be executed
   */
  constructor(suitsPath, selectedAddresses) {
    this.suitsPath = suitsPath;
    this.selectedCases = [];
    this.suits = [];

    const suitDirs = fs.readdirSync(this.suitsPath, { withFileTypes: true })
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name);

    for (const suitDir of suitDirs) {
      const suitPath = path.join(this.suitsPath, suitDir);

      const suit = new TestSuit(this, suitPath);
      this.suits.push(suit);

      for (const selectedAddress of selectedAddresses) {
        if (selectedAddress.testSuitName === suitDir) {
          if (selectedAddress.testCaseName === null) {
            this.selectedCases = this.selectedCases.concat(suit.getCases());
            break;
          } else {
            this.selectedCases.push(suit.getCase(selectedAddress.testCaseName));
          }
        }
      }
    }

    this.selectedCases = this.selectedCases.filter(el => el != null);
    // remove duplicates
    this.selectedCases = Array.from(new Set(this.selectedCases));

    // if no suits/cases were selected, considering that the user wants all defined cases to be executed
    if (this.selectedCases.length === 0) {
      for (const suit of this.suits) {
        this.selectedCases = this.selectedCases.concat(suit.getCases());
      }
    }
  }

  /**
   * Sets the test cases processor for future references
   * @param {Processor} processor the test cases processor
   */
  setProcessor(processor) {
    this.processor = processor;
  }
}

/**
 * Exports the CasesManager class
 * @type {CasesManager}
 */
module.exports = CasesManager;

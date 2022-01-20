/**
 * Execution point for all tests project wide
 * @type {{checkEqual: (function(*, *, String): boolean),
 * checkMapEqual: ((function(Map, Map): boolean)|*)}} Code for assisting with tests
 * @author https://github.com/Landaman
 */
module.exports = {
    checkEqual : checkEqual,
    checkMapEqual : checkMapEqual
}

// Imports tests
const { runDeltaCalculatorTests } = require('./TestDeltaCalculator');
const { runDeltaCleanupTests } = require('./TestDeltaCleanupWorker');

// Execution code
if (executeTests()) {
    console.log("Test Suite passed");
}

/**
 * Executes the full test suite
 * @returns {boolean} whether or not the test suite succeeded
 */
function executeTests() {
    const testResult = runDeltaCalculatorTests() && runDeltaCleanupTests();
    return checkEqual(true, testResult, "Test Suite");
}

/**
 * Checks if the expected and actual values are equal using console.assert() but with a usable error message
 * @param expected {*} the expected value of the test
 * @param actual {*} the actual value of the test
 * @param testName {String} the name of the test, used for error outputting
 * @return {boolean} whether or not the test succeeded
 */
function checkEqual(expected, actual, testName) {
    const result = expected === actual;
    console.assert(result, testName + " failed. Expected " + expected + " got " + actual);
    return result;
}

/**
 * Checks if two maps are equal by doing an element by element comparison. Works for nested maps by way of recursion
 * @param map1 {Map} the first map
 * @param map2 {Map} the second map
 * @return {boolean} whether or not the maps are equal
 */
function checkMapEqual(map1, map2) {
    if (map1.size !== map2.size) {
        // If the lengths aren't equal, we can fail the test
        return false;
    }

    for (let [k, v] in map1) {
        // If either map doesn't have the key, we can return false
        if (!map1.has(k) || !map2.has(k)) {
            return false;
        }

        // Here we can check nested maps by recursion
        if (v instanceof Map) {
            if (!checkMapEqual(map1.get(k), map2.get(k))) {
                return false;
            }
        } else {
            if (map1.get(k) !== map2.get(k)) {
                return false;
            }
        }
    }

    return true;
}
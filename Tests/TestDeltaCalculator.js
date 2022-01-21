/**
 * Tests for DeltaCalculator.js
 * @type {{runDeltaCalculatorTests: (function(): boolean)}} runs the test suite for DeltaCalculator.js
 * @author https://github.com/Landaman
 */
module.exports = {
    runDeltaCalculatorTests : runTestSuite
}

// Imports from relevant files
const {reset, distanceReceived, deltaBetween, hasDriver} = require("../DeltaCalculation/DeltaCalculator");
const {DISTANCE_INTERVAL, DISTANCE_UPPER_BOUND, COMMON_DATAPOINTS} = require("../config.json");
const { checkEqual } = require('./Test');

/**
 * Executes the entire test suite for DeltaCalculator.js
 * @return {boolean} whether or not the test succeeded
 */
function runTestSuite() {
    const testResult = test1() && test2() && test3() && test4() && test5() && test6() && test7() && test8() && test9();
    return checkEqual(true, testResult, "Delta Calculator");
}

/**
 * Test 1, simple test case
 * @return {boolean} whether or not the test succeeded
 */
function test1() {
    reset();
    distanceReceived(1, DISTANCE_INTERVAL, 5000);
    distanceReceived(2, DISTANCE_INTERVAL, 7000);
    return checkEqual(5000 - 7000, deltaBetween(1, 2), "Calculator 1-1") &&
    checkEqual(7000 - 5000, deltaBetween(2, 1), "Calculator 1-2");
}

/**
 * Test 2, simple test case
 * @return {boolean} whether or not the test succeeded
 */
function test2() {
    reset();
    distanceReceived(7, DISTANCE_INTERVAL, 9000);
    distanceReceived(20, DISTANCE_INTERVAL, 6000);
    return checkEqual(9000 - 6000, deltaBetween(7, 20), "Calculator 2-1") &&
    checkEqual(6000 - 9000, deltaBetween(20, 7), "Calculator 2-2");
}

/**
 * Test 3, edge case (delta is 0)
 * @return {boolean} whether or not the test succeeded
 */
function test3() {
    reset();
    distanceReceived(15, DISTANCE_INTERVAL, 10000);
    distanceReceived(17, DISTANCE_INTERVAL, 10000);
    return checkEqual(10000 - 10000, deltaBetween(15, 17), "Calculator 3-1") &&
    checkEqual(10000 - 10000, deltaBetween(17, 15), "Calculator 3-2");
}

/**
 * Test 4, complex case. Should only compare the relevant values, not the one where car 44 is ahead
 * @return {boolean} whether or not the test succeeded
 */
function test4() {
    reset();
    distanceReceived(44, 0, 70000);
    distanceReceived(44, DISTANCE_INTERVAL, 80000);
    distanceReceived(77, 0, 124000);
    return checkEqual(70000 - 124000, deltaBetween(44, 77), "Calculator 4-1") &&
    checkEqual(124000 - 70000, deltaBetween(77, 44), "Calculator 4-2");
}

/**
 * Test 5, another case where car 99s further distance should be ignored
 * @return {boolean} whether or not the test succeeded
 */
function test5() {
    reset();
    distanceReceived(99, 0, 45);
    distanceReceived(99, DISTANCE_INTERVAL, 50);
    distanceReceived(124, 0, 55);
    return checkEqual(45 - 55, deltaBetween(99, 124), "Calculator 5-1") &&
    checkEqual(55 - 45, deltaBetween(124, 99), "Calculator 5-2");
}

/**
 * Test 6, ensures that irrelevant distances are ignored
 * @return {boolean} whether or not the test succeeded
 */
function test6() {
    reset();
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND + 1, 123)
    return checkEqual(false, hasDriver(1234), "Calculator 6");
}

/**
 * Test 7, ensures that distances that follow the upper bound but aren't exact are allowed
 * @return {boolean} whether or not the test succeeded
 */
function test7() {
    reset();
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 125);
    distanceReceived(1, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2.23, 125);
    return checkEqual(0, deltaBetween(1234, 1), "Calculator 7-1") &&
    checkEqual(0, deltaBetween(1, 1234), "Calculator 7-2");
}

/**
 * Test 8, ensures that distances are averaged
 * @return {boolean} whether or not the test succeeded
 */
function test8() {
    reset();
    distanceReceived(123, DISTANCE_INTERVAL, 1);
    distanceReceived(124, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 5);
    distanceReceived(123, DISTANCE_INTERVAL * 2, 10);
    distanceReceived(124, DISTANCE_INTERVAL * 2 + DISTANCE_UPPER_BOUND / 4, 20);
    return checkEqual(-7, deltaBetween(123, 124), "Calculator 8-1") &&
    checkEqual(7, deltaBetween(124, 123), "Calculator 8-2");
}

/**
 * Test 9, ensures that only the relevant number of distances are averaged
 * @return {boolean} whether or not the test succeeded
 */
function test9() {
    reset();
    distanceReceived(1, 0, 0);
    distanceReceived(2, 0, 50);
    for (let i = 1; i <= COMMON_DATAPOINTS; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i);
        distanceReceived(2, i * DISTANCE_INTERVAL, i);
    }
    return checkEqual(0, deltaBetween(1, 2), "Calculator 9-1") &&
    checkEqual(0, deltaBetween(2, 1), "Calculator 9-2");
}
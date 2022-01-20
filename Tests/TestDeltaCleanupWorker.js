/**
 * Tests for DeltaCleanupWorker.js
 * @type {{runDeltaCleanupTests: (function(): boolean)}} runs the entire test suite for DeltaCleanupWorker.js
 * @author https://github.com/Landaman
 */
module.exports = {
    runDeltaCleanupTests : runTestSuite
}

const {cleanupSet} = require("../DeltaCalculation/DeltaCleanupWorker");
const {COMMON_DATAPOINTS} = require("../config.json");
const {checkEqual, checkMapEqual} = require('./Test');

/**
 * Runs the entire test suite for DeltaCleanupWorker.js
 * @returns {boolean} whether or not the test succeeded
 */
function runTestSuite() {
    const testResult = test1() && test2() && test3();
    return checkEqual(true, testResult, "Cleanup Worker");
}

/**
 * Test 1, not enough to delete so sets should be the same
 * @return {boolean} whether or not the test succeeded
 */
function test1() {
    let testMap1 = new Map();
    let copyMap1 = new Map();
    testMap1.set(1, new Map());
    copyMap1.set(1, new Map());
    testMap1.set(2, new Map());
    copyMap1.set(2, new Map());
    testMap1.set(3, new Map());
    copyMap1.set(3, new Map());
    testMap1.get(1).set(100, 550);
    copyMap1.get(1).set(100, 550);
    testMap1.get(2).set(100, 600);
    copyMap1.get(2).set(100, 600);
    testMap1.get(3).set(100, 700);
    copyMap1.get(3).set(100, 700);
    testMap1 = cleanupSet(testMap1);
    return checkEqual(true, checkMapEqual(testMap1, copyMap1), "Cleanup 1");
}

/**
 * Test 2, should delete one entry
 * @return {boolean} whether or not the test succeeded
 */
function test2() {
    let testMap2 = new Map();
    testMap2.set(5, new Map());
    testMap2.set(6, new Map());
    testMap2.set(7, new Map());

    for (let i = 0; i <= COMMON_DATAPOINTS; i++) {
        testMap2.get(5).set(i, i + 100);
        testMap2.get(6).set(i, i + 102);
        testMap2.get(7).set(i, i + 104);
    }

    let copyMap2 = new Map();
    copyMap2.set(5, new Map());
    copyMap2.get(5).set(0, 100);
    copyMap2.set(6, new Map());
    copyMap2.get(6).set(0, 102);
    copyMap2.set(7, new Map());
    copyMap2.get(7).set(0, 104);
    testMap2 = cleanupSet(testMap2);
    return checkEqual(true, checkMapEqual(testMap2, copyMap2), "Cleanup 2");
}

/**
 * Test 3, should delete COMMON_DATAPOINTS points
 * @return {boolean} whether or not the test succeeded
 */
function test3() {
    let testMap3 = new Map();
    testMap3.set(10, new Map());
    testMap3.set(11, new Map());
    testMap3.set(12, new Map());

    for (let i = 0; i < 2 * COMMON_DATAPOINTS; i++) {
        testMap3.get(10).set(i + 1, i + 200);
        testMap3.get(11).set(i + 1, i + 202);
        testMap3.get(12).set(i + 1, i + 204);
    }

    let copyMap3 = new Map();
    copyMap3.set(10, new Map());
    copyMap3.set(11, new Map());
    copyMap3.set(12, new Map());

    for (let i = COMMON_DATAPOINTS; i < 2 * COMMON_DATAPOINTS; i++) {
        copyMap3.get(10).set(i + 1, i + 200);
        copyMap3.get(11).set(i + 1, i + 202);
        copyMap3.get(12).set(i + 1, i + 204);
    }

    testMap3 = cleanupSet(testMap3);
    return checkEqual(true, checkMapEqual(testMap3, copyMap3), "Cleanup 3");
}
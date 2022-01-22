/**
 * Tests for delta_calculation.worker.js
 * @author https://github.com/Landaman
 */

const {cleanupSet} = require("../src/delta_calculation/delta_calculator.worker");
const {POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} = require("../config.json");

/**
 * Test 1, not enough to delete so sets should be the same
 */
test("Cleanup 1", () => {
    // Sets up the expected and result, 2 cars
    let result = new Map();
    let expected = new Map();
    result.set(1, new Map());
    expected.set(1, new Map());
    result.set(2, new Map());
    expected.set(2, new Map());

    // Fills with one less than the requisite amount
    for (let i = 0; i < POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH - 1; i++) {
        result.get(1).set(i, 50 * i);
        expected.get(1).set(i, 50 * i);
        result.get(2).set(i, 60 * i);
        expected.get(2).set(i, 60 * i);
    }

    result = cleanupSet(result);
    expect(result).toEqual(expected);
});

/**
 * Test 2, should delete one entry
 */
test("Cleanup 2", () => {
    // Sets up the result and expected, 3 cars
    let result = new Map();
    let expected = new Map();
    result.set(5, new Map());
    expected.set(5, new Map());
    result.set(6, new Map());
    expected.set(6, new Map());
    result.set(7, new Map());
    expected.set(7, new Map());

    // Adds in one extra point on top of the max
    for (let i = 0; i <= POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        result.get(5).set(i, i + 100);
        result.get(6).set(i, i + 102);
        result.get(7).set(i, i + 104);
    }
    result = cleanupSet(result);

    // Fills the expected, all but the first element that would be in result
    for (let i = 1; i <= POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        expected.get(5).set(i, i + 100);
        expected.get(6).set(i, i + 102);
        expected.get(7).set(i, i + 104);
    }

    expect(result).toEqual(expected);
});

/**
 * Test 3, should delete POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH points
 */
test("Cleanup 3", () => {
    // Sets up the result and expected, 3 cars
    let result = new Map();
    let expected = new Map();
    result.set(10, new Map());
    expected.set(10, new Map());
    result.set(11, new Map());
    expected.set(11, new Map());
    result.set(12, new Map());
    expected.set(12, new Map());

    // Adds in all the points
    for (let i = 0; i < 2 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        result.get(10).set(i, i + 200);
        result.get(11).set(i, i + 202);
        result.get(12).set(i, i + 204);
    }
    result = cleanupSet(result);

    // Adds the results for the expected, should be the second half of the points that are kept
    for (let i = POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i < 2 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        expected.get(10).set(i, i + 200);
        expected.get(11).set(i, i + 202);
        expected.get(12).set(i, i + 204);
    }

    expect(result).toEqual(expected);
});

/**
 * Test 4, ensures that points not held by all are ignored
 */
test("Cleanup 4", () => {
    // Sets up the result and expected, 3 cars
    let result = new Map();
    let expected = new Map();
    result.set(1, new Map());
    expected.set(1, new Map());
    result.set(2, new Map());
    expected.set(2, new Map());
    result.set(3, new Map());
    expected.set(3, new Map());

    // These should all be kept as they are different per car
    for (let i = 0; i <= POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        result.get(1).set(i, 10);
        expected.get(1).set(i, 10);
        result.get(2).set(i + 2 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH, 20);
        expected.get(2).set(i + 2 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH, 20);
        result.get(3).set(i + 3 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH, 30);
        expected.get(3).set(i + 3 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH, 30);
    }

    // The smallest out of these (100, x) should be deleted even though the above points are bigger
    for (let i = 0; i <= POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        result.get(1).set(100 + i, 50);
        expected.get(1).set(100 + i, 50);
        result.get(2).set(100 + i, 60);
        expected.get(2).set(100 + i, 60);
        result.get(3).set(100 + i, 70);
        expected.get(3).set(100 + i, 70);
    }

    // Does the expected operation of cleanupSet, removing the lowest element
    expected.get(1).delete(100);
    expected.get(2).delete(100);
    expected.get(3).delete(100);
    result = cleanupSet(result);

    expect(result).toEqual(expected);
});
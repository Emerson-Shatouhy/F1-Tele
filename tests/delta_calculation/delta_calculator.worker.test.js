/**
 * Tests for delta_calculation.worker.js
 * @author https://github.com/Landaman
 */

const {cleanupSet} = require("../../src/delta_calculation/delta_calculator.worker");
const {POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} = require("../../config.json");

/**
 * cleanup Error checking.
 * Any map that doesn't follow the format laid out in delta_calculator.js should result in an Error being thrown
 */
test("cleanup Error checking", () => {
    expect(() => {cleanupSet("asdf")}).toThrow();
    expect(() => {cleanupSet(new Map().set("asdf", new Map()))}).toThrow();
    expect(() => {cleanupSet(new Map().set(1, "asdf"))}).toThrow();
    expect(() => {cleanupSet(new Map().set(1, new Map().set("asdf", 1)))}).toThrow();
    expect(() => {cleanupSet(new Map().set(1, new Map().set(1, "asdf")))}).toThrow();

    // Depth case. Even if only the last element is invalid, the map passed in shouldn't be modified and should error

    // Setup
    let result = new Map();
    let expected = new Map();
    result.set(1, new Map());
    expected.set(1, new Map());
    result.set(2, new Map());
    expected.set(2, new Map());
    result.set(3, new Map());
    expected.set(3, new Map());
    result.get(1).set(3, 4);
    expected.get(1).set(3, 4);
    result.get(2).set(3, 4);
    expected.get(2).set(3, 4);
    result.get(3).set(3, "cdf");
    expected.get(3).set(3, "cdf");

    expect(() => {cleanupSet(result)}).toThrow();
    expect(result).toEqual(expected); // Verifies that there is no side effect when erroring
});

/**
 * cleanup edge case.
 * Empty maps should just return themselves
 */
test("cleanup edge case", () => {
    let result = new Map();
    let expected = new Map();
    expect(cleanupSet(result)).toEqual(expected);
});

/**
 * cleanup edge case.
 * Empty nested maps should return themselves, even if any of them are filled
 */
test("cleanup edge case", () => {
    // Setup, two maps with one empty nested
    let result = new Map();
    let expected = new Map();
    result.set(5, new Map());
    expected.set(5, new Map())
    result.set(10, new Map().set(5, 15));
    expected.set(10, new Map().set(5, 15));

    // Validation
    expect(cleanupSet(result)).toEqual(expected);
})

/**
 * cleanup edge case.
 * Not enough elements to clean up, so nothing should happen
 */
test("cleanup edge case", () => {
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

    cleanupSet(result);
    expect(result).toEqual(expected);
});

/**
 * cleanup base case.
 * Should delete one element, also verifies that result is modified
 */
test("cleanup base case", () => {
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

    // Fills the expected, all but the first element that would be in result
    for (let i = 1; i <= POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        expected.get(5).set(i, i + 100);
        expected.get(6).set(i, i + 102);
        expected.get(7).set(i, i + 104);
    }

    // The combination ensures that the correct value is returned and that the side effect works
    expect(cleanupSet(result)).toEqual(result);
    expect(result).toEqual(expected);
});

/**
 * cleanup middle case.
 * Should delete POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH points, also verifies that result is modified
 */
test("cleanup middle case", () => {
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

    // Adds the results for the expected, should be the second half of the points that are kept
    for (let i = POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i < 2 * POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; i++) {
        expected.get(10).set(i, i + 200);
        expected.get(11).set(i, i + 202);
        expected.get(12).set(i, i + 204);
    }

    // The combination ensures that the correct value is returned and that the side effect works
    expect(cleanupSet(result)).toEqual(result);
    expect(result).toEqual(expected);
});

/**
 * cleanup edge case.
 * Any points that aren't held by all drivers should be ignored
 */
test("cleanup edge case", () => {
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

    // The combination ensures that the correct value is returned and that the side effect works
    expect(cleanupSet(result)).toEqual(result);
    expect(result).toEqual(expected);
});
// TODO: Tests for both toCatch functions
/**
 * Tests for delta_calculation.js
 * @author https://github.com/Landaman
 */

// Imports from relevant files
const {reset, distanceReceived, deltaBetween, hasDriver, toCatchLapBased, toCatchRealTime} =
    require("../../src/js/delta_calculation/delta_calculator");
const {DISTANCE_INTERVAL, DISTANCE_UPPER_BOUND, POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} = require("../../config.json");

/**
 * Resets the storage before each test
 */
beforeEach(() => {
    reset();
});

/**
 * distanceReceived Error checking.
 * Ensures that bad types result in an error being thrown and that the values aren't stored
 */
test("distanceReceived Error checking", () => {
    let a = "a"
    expect(() => {distanceReceived(a, 1, 1);}).toThrow();
    expect(hasDriver(a)).toEqual(false);
    expect(() => {distanceReceived(2, new Map(), 2);}).toThrow();
    expect(hasDriver(2)).toEqual(false);
    expect(() => {distanceReceived(3, 5, new Set());}).toThrow();
    expect(hasDriver(3)).toEqual(false);
    let map = new Map();
    expect(() => {distanceReceived(map, new Set(), "");}).toThrow();
    expect(hasDriver(map)).toEqual(false);
});

/**
 * deltaBetween Error checking.
 * Ensures that drivers that aren't in the system result in an Error being thrown
 */
test("deltaBetween Error checking", () => {
    distanceReceived(1, 1, 1);
    distanceReceived(2, 1, 1);
    expect(() => {deltaBetween(1, 5)}).toThrow();
    expect(() => {deltaBetween(10, 2)}).toThrow();
    expect(() => {deltaBetween(10, 15)}).toThrow();
});

/**
 * distanceReceived and deltaBetween base case
 */
test("distanceReceived and deltaBetween base case", () => {
    distanceReceived(1, DISTANCE_INTERVAL, 5000);
    distanceReceived(2, DISTANCE_INTERVAL, 7000);
    expect(deltaBetween(1, 2)).toEqual(5000 - 7000);
    expect(deltaBetween(2, 1)).toEqual(7000 - 5000);
});

/**
 * distanceReceived and deltaBetween base case
 */
test("distanceReceived and deltaBetween base case", () => {
    distanceReceived(7, DISTANCE_INTERVAL, 9000);
    distanceReceived(20, DISTANCE_INTERVAL, 6000);
    expect(deltaBetween(7, 20)).toEqual(9000 - 6000);
    expect(deltaBetween(20, 7)).toEqual(6000 - 9000);
});

/**
 * distanceReceived and deltaBetween edge case (delta is 0)
 */
test("distanceReceived and deltaBetween edge case", () => {
    distanceReceived(15, DISTANCE_INTERVAL, 10000);
    distanceReceived(17, DISTANCE_INTERVAL, 10000);
    expect(deltaBetween(15, 17)).toEqual(10000 - 10000);
    expect(deltaBetween(17, 15)).toEqual(10000 - 10000);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Should only compare the relevant values, not the one where car 44 is ahead
 */
test("distanceReceived and deltaBetween complex case", () => {
    distanceReceived(44, 0, 70000);
    distanceReceived(44, DISTANCE_INTERVAL, 80000);
    distanceReceived(77, 0, 124000);
    expect(deltaBetween(44, 77)).toEqual(70000 - 124000);
    expect(deltaBetween(77, 44)).toEqual(124000 - 70000);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Should only compare the relevant values, not the one where car 99 is ahead
 */
test("distanceReceived and deltaBetween complex case", () => {
    distanceReceived(99, 0, 45);
    distanceReceived(99, DISTANCE_INTERVAL, 50);
    distanceReceived(124, 0, 55);
    expect(deltaBetween(99, 124)).toEqual(45 - 55);
    expect(deltaBetween(124, 99)).toEqual(55 - 45);
});

/**
 * distanceReceived and hasDriver base case.
 * Irrelevant distances should be ignored as defined by the config settings
 */
test("distanceReceived and hasDriver base case", () => {
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND + 1, 123)
    expect(hasDriver(1234)).toEqual(false);
});

/**
 * distanceReceived and hasDriver edge case.
 * Ensures that if one driver has an intermediate distance not shared by the other it is ignored
 */
test("distanceReceived and deltaBetween edge case", () => {
    // Sets up the distances
    distanceReceived(77, 500, 500);
    distanceReceived(99, 500, 700);
    distanceReceived(77, 600, 501); // This would significantly change the average
    distanceReceived(77, 1000, 800);
    distanceReceived(99, 1000, 1000);

    expect(deltaBetween(77, 99)).toEqual(-200);
    expect(deltaBetween(99, 77)).toEqual(200);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Distances that aren't exactly the same but within the margin of error as defined by the config should be considered
 * equivalent
 */
test("distanceReceived and deltaBetween complex case", () => {
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 125);
    distanceReceived(1, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2.23, 125);
    expect(deltaBetween(1234, 1)).toEqual(0);
    expect(deltaBetween(1, 1234)).toEqual(0);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Multiple distances should be averaged to produce the final distance
 */
test("distanceReceived and deltaBetween complex case", () => {
    distanceReceived(123, DISTANCE_INTERVAL, 1);
    distanceReceived(124, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 5);
    distanceReceived(123, DISTANCE_INTERVAL * 2, 10);
    distanceReceived(124, DISTANCE_INTERVAL * 2 + DISTANCE_UPPER_BOUND / 4, 20);
    expect(deltaBetween(123, 124)).toEqual(-7);
    expect(deltaBetween(124, 123)).toEqual(7);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Multiple distances should only be averaged up to the number defined in the config
 */
test("distanceReceived and deltaBetween complex case", () => {
    distanceReceived(1, 0, 0);
    distanceReceived(2, 0, 50);
    for (let i = 1; i <= POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i);
        distanceReceived(2, i * DISTANCE_INTERVAL, i);
    }
    expect(deltaBetween(1, 2)).toEqual(0);
    expect(deltaBetween(2, 1)).toEqual(0);
});

/**
 * toCatchLapBased Error checking.
 * If either driver isn't in the system or either of the last laps is NaN results in an Error being thrown
 */
test("toCatchLapBased Error checking", () => {
    distanceReceived(5, 6, 8);
    distanceReceived(8, 6, 5);
    expect(() => {toCatchLapBased(15, 8, 25, 32)}).toThrow();
    expect(() => {toCatchLapBased(5, 25, 67, 89)}).toThrow();
    expect(() => {toCatchLapBased(5, 8, "asfd", 25)}).toThrow();
    expect(() => {toCatchLapBased(8, 5, 74, new Map())}).toThrow();
    expect(() => {toCatchLapBased(16, 25, new Set(), "dcd")}).toThrow();
});

/**
 * distanceReceived and toCatchLapBased simple case
 */
test("distanceReceived and toCatchLapBased simple case", () => {
    distanceReceived(1, DISTANCE_INTERVAL, 50);
    distanceReceived(2, DISTANCE_INTERVAL, 100);
    expect(toCatchLapBased(1, 2, 20, 10)).toEqual(5);
});

/**
 * distanceReceived and toCatchLapBased simple case
 */
test("distanceReceived and toCatchLapBased simple case", () => {
    distanceReceived(34, DISTANCE_INTERVAL * 5, 125);
    distanceReceived(56, DISTANCE_INTERVAL * 5, 225);
    expect(toCatchLapBased(34, 56, 2, 1)).toEqual(100);
});

/**
 * distanceReceived and toCatchLapBased complex case.
 * When car two isn't catching car one, -1 should be returned
 */
test("distanceReceived and toCatchLapBased complex case", () => {
    distanceReceived(44, DISTANCE_INTERVAL * 3, 5);
    distanceReceived(77, DISTANCE_INTERVAL * 3, 10);
    expect(toCatchLapBased(44, 77, 1, 2)).toEqual(-1);
});

/**
 * distanceReceived and toCatchLapBased edge case.
 * If the delta between car one and car two is 0, the laps to catch should be 0 regardless of anything else
 */
test("distanceReceived and toCatchLapBased edge case", () => {
    distanceReceived(123, DISTANCE_INTERVAL * 10, 5);
    distanceReceived(15, DISTANCE_INTERVAL * 10, 5);
    expect(toCatchLapBased(123, 15, 5, 4)).toEqual(0);
    expect(toCatchLapBased(123, 15, 4, 5)).toEqual(0);
    expect(toCatchLapBased(15, 123, 5, 4)).toEqual(0);
    expect(toCatchLapBased(15, 123, 4, 5)).toEqual(0);
});

/**
 * distanceReceived and toCatchLapBased edge case.
 * If car two is ahead, -1 should be returned regardless of whether car  one is catching
 */
test("distanceReceived and toCatchLapBased edge case", () => {
    distanceReceived(99, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND - 1, 4);
    distanceReceived(101, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND - 1, 3);
    expect(toCatchLapBased(99, 101, 1, 2)).toEqual(-1);
    expect(toCatchLapBased(99, 101, 2, 1)).toEqual(-1);
});

/**
 * distanceReceived and toCatchLapBased complex case.
 * Fractional numbers of laps to catch should work as expected
 */
test("distanceReceived and toCatchLapBased complex case", () => {
    distanceReceived(13, DISTANCE_INTERVAL * 17, 10);
    distanceReceived(14, DISTANCE_INTERVAL * 17, 15);
    expect(toCatchLapBased(13, 14, 6, 4)).toEqual(2.5);
});
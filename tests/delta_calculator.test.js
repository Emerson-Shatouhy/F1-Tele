// TODO: Tests for both toCatch functions
/**
 * Tests for delta_calculation.js
 * @author https://github.com/Landaman
 */

// Imports from relevant files
const {reset, distanceReceived, deltaBetween, hasDriver, toCatchLapBased, toCatchRealTime} =
    require("../src/delta_calculation/delta_calculator");
const {DISTANCE_INTERVAL, DISTANCE_UPPER_BOUND, POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} = require("../config.json");

/**
 * Resets the storage before each test
 */
beforeEach(() => {
    reset();
});

/**
 * Test 1, simple test case
 */
test("Calculator 1", () => {
    distanceReceived(1, DISTANCE_INTERVAL, 5000);
    distanceReceived(2, DISTANCE_INTERVAL, 7000);
    expect(deltaBetween(1, 2)).toEqual(5000 - 7000);
    expect(deltaBetween(2, 1)).toEqual(7000 - 5000);
});

/**
 * Test 2, simple test case
 */
test("Calculator 2", () => {
    distanceReceived(7, DISTANCE_INTERVAL, 9000);
    distanceReceived(20, DISTANCE_INTERVAL, 6000);
    expect(deltaBetween(7, 20)).toEqual(9000 - 6000);
    expect(deltaBetween(20, 7)).toEqual(6000 - 9000);
});

/**
 * Test 3, edge case (delta is 0)
 */
test("Calculator 3", () => {
    distanceReceived(15, DISTANCE_INTERVAL, 10000);
    distanceReceived(17, DISTANCE_INTERVAL, 10000);
    expect(deltaBetween(15, 17)).toEqual(0);
    expect(deltaBetween(17, 15)).toEqual(0);
});

/**
 * Test 4, complex case. Should only compare the relevant values, not the one where car 44 is ahead
 */
test("Test 4", () => {
    distanceReceived(44, 0, 70000);
    distanceReceived(44, DISTANCE_INTERVAL, 80000);
    distanceReceived(77, 0, 124000);
    expect(deltaBetween(44, 77)).toEqual(70000 - 124000);
    expect(deltaBetween(77, 44)).toEqual(124000 - 70000);
});

/**
 * Test 5, another case where car 99s further distance should be ignored
 */
test("Test 5", () => {
    distanceReceived(99, 0, 45);
    distanceReceived(99, DISTANCE_INTERVAL, 50);
    distanceReceived(124, 0, 55);
    expect(deltaBetween(99, 124)).toEqual(45 - 55);
    expect(deltaBetween(124, 99)).toEqual(55 - 45);
});

/**
 * Test 6, ensures that irrelevant distances are ignored
 */
test("Test 6", () => {
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND + 1, 123)
    expect(hasDriver(1234)).toEqual(false);
});

/**
 * Test 7, ensures that distances that follow the upper bound but aren't exact are allowed
 */
test("Test 7", () => {
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 125);
    distanceReceived(1, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2.23, 125);
    expect(deltaBetween(1234, 1)).toEqual(0);
    expect(deltaBetween(1, 1234)).toEqual(0);
});

/**
 * Test 8, ensures that distances are averaged
 */
test("Test 8", () => {
    distanceReceived(123, DISTANCE_INTERVAL, 1);
    distanceReceived(124, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 5);
    distanceReceived(123, DISTANCE_INTERVAL * 2, 10);
    distanceReceived(124, DISTANCE_INTERVAL * 2 + DISTANCE_UPPER_BOUND / 4, 20);
    expect(deltaBetween(123, 124)).toEqual(-7);
    expect(deltaBetween(124, 123)).toEqual(7);
});

/**
 * Test 9, ensures that only the relevant number of distances are averaged
 */
test("Test 9", () => {
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
 * Test 10, basic test for toCatchLapBased
 */
test("Test 10", () => {
    distanceReceived(1, DISTANCE_INTERVAL, 50);
    distanceReceived(2, DISTANCE_INTERVAL, 100);
    expect(toCatchLapBased(1, 2, 20, 10)).toEqual(5);
});

/**
 * Test 11, another basic test for toCatchLapBased
 */
test("Test 11", () => {
    distanceReceived(34, DISTANCE_INTERVAL * 5, 125);
    distanceReceived(56, DISTANCE_INTERVAL * 5, 225);
    expect(toCatchLapBased(34, 56, 2, 1)).toEqual(100);
});

/**
 * Test 12, case where driverTwo isn't catching driverOne
 */
test("Test 12", () => {
    distanceReceived(44, DISTANCE_INTERVAL * 3, 5);
    distanceReceived(77, DISTANCE_INTERVAL * 3, 10);
    expect(toCatchLapBased(44, 77, 1, 2)).toEqual(-1);
});

/**
 * Test 13, case where driverOne and driverTwo are tied, so it should be 0 regardless of who is lapping faster and
 * the order given to the function
 */
test("Test 13", () => {
    distanceReceived(123, DISTANCE_INTERVAL * 10, 5);
    distanceReceived(15, DISTANCE_INTERVAL * 10, 5);
    expect(toCatchLapBased(123, 15, 5, 4)).toEqual(0);
    expect(toCatchLapBased(123, 15, 4, 5)).toEqual(0);
    expect(toCatchLapBased(15, 123, 5, 4)).toEqual(0);
    expect(toCatchLapBased(15, 123, 4, 5)).toEqual(0);
});

/**
 * Test 14, ensures that -1 is returned if driverTwo is the car ahead regardless of lap times
 */
test("Test 14", () => {
    distanceReceived(99, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND - 1, 4);
    distanceReceived(101, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND - 1, 3);
    expect(toCatchLapBased(99, 101, 1, 2)).toEqual(-1);
    expect(toCatchLapBased(99, 101, 2, 1)).toEqual(-1);
});

/**
 * Test 15, ensures that fractional laps to catch works
 */
test("Test 15", () => {
    distanceReceived(13, DISTANCE_INTERVAL * 17, 10);
    distanceReceived(14, DISTANCE_INTERVAL * 17, 15);
    expect(toCatchLapBased(13, 14, 6, 4)).toEqual(2.5);
});
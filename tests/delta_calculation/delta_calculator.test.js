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
test("distanceReceived bad types Error", () => {
    let a = "a"
    expect(() => {distanceReceived(a, 1, 1);}).toThrow(TypeError);
    expect(hasDriver(a)).toEqual(false);
    expect(() => {distanceReceived(2, new Map(), 2);}).toThrow(TypeError);
    expect(hasDriver(2)).toEqual(false);
    expect(() => {distanceReceived(3, 5, new Set());}).toThrow(TypeError);
    expect(hasDriver(3)).toEqual(false);
    let map = new Map();
    expect(() => {distanceReceived(map, new Set(), "");}).toThrow(TypeError);
    expect(hasDriver(map)).toEqual(false);
});

/**
 * deltaBetween Error checking.
 * Ensures that drivers that aren't in the system result in an Error being thrown
 */
test("deltaBetween driver doesn't exist Error", () => {
    distanceReceived(1, 1, 1);
    distanceReceived(2, 1, 1);
    expect(() => {deltaBetween(1, 5)}).toThrow(Error);
    expect(() => {deltaBetween(10, 2)}).toThrow(Error);
    expect(() => {deltaBetween(10, 15)}).toThrow(Error);
});

/**
 * distanceReceived and deltaBetween base case
 */
test("distanceReceived and deltaBetween simple case", () => {
    distanceReceived(1, DISTANCE_INTERVAL, 5000);
    distanceReceived(2, DISTANCE_INTERVAL, 7000);
    expect(deltaBetween(1, 2)).toEqual(5000 - 7000);
    expect(deltaBetween(2, 1)).toEqual(7000 - 5000);
});

/**
 * distanceReceived and deltaBetween base case
 */
test("distanceReceived and deltaBetween simple case", () => {
    distanceReceived(7, DISTANCE_INTERVAL, 9000);
    distanceReceived(20, DISTANCE_INTERVAL, 6000);
    expect(deltaBetween(7, 20)).toEqual(9000 - 6000);
    expect(deltaBetween(20, 7)).toEqual(6000 - 9000);
});

/**
 * distanceReceived and deltaBetween edge case (delta is 0)
 */
test("distanceReceived and deltaBetween cars level", () => {
    distanceReceived(15, DISTANCE_INTERVAL, 10000);
    distanceReceived(17, DISTANCE_INTERVAL, 10000);
    expect(deltaBetween(15, 17)).toEqual(10000 - 10000);
    expect(deltaBetween(17, 15)).toEqual(10000 - 10000);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Should only compare the relevant values, not the one where car 44 is ahead
 */
test("distanceReceived and deltaBetween compare only relevant values", () => {
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
test("distanceReceived and deltaBetween compare only relevant values", () => {
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
test("distanceReceived and hasDriver ignore irrelevant distances", () => {
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND + 1, 123)
    expect(hasDriver(1234)).toEqual(false);
});

/**
 * distanceReceived and hasDriver edge case.
 * Ensures that if one driver has an intermediate distance not shared by the other it is ignored
 */
test("distanceReceived and deltaBetween ignore intermediate distances", () => {
    // Sets up the distances
    distanceReceived(77, 500, 500);
    distanceReceived(99, 500, 700);
    distanceReceived(77, 600, 501); // This would significantly change the average
    distanceReceived(77, 1000, 800);
    distanceReceived(99, 1000, 1000);

    expect(deltaBetween(77, 99)).toEqual((500 - 700 + 800 - 1000) / 2);
    expect(deltaBetween(99, 77)).toEqual((700 - 500 + 1000 - 800) / 2);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Distances that aren't exactly the same but within the margin of error as defined by the config should be considered
 * equivalent
 */
test("distanceReceived and deltaBetween distance bounds followed", () => {
    distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 125);
    distanceReceived(1, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2.23, 125);
    expect(deltaBetween(1234, 1)).toEqual(0);
    expect(deltaBetween(1, 1234)).toEqual(0);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Multiple distances should be averaged to produce the final distance
 */
test("distanceReceived and deltaBetween average multiple distances", () => {
    distanceReceived(123, DISTANCE_INTERVAL, 1);
    distanceReceived(124, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 5);
    distanceReceived(123, DISTANCE_INTERVAL * 2, 10);
    distanceReceived(124, DISTANCE_INTERVAL * 2 + DISTANCE_UPPER_BOUND / 4, 20);
    expect(deltaBetween(123, 124)).toEqual((1 - 5 + 10 - 20) / 2);
    expect(deltaBetween(124, 123)).toEqual((5 - 1 + 20 - 10) / 2);
});

/**
 * distanceReceived and deltaBetween complex case.
 * Multiple distances should only be averaged up to the number defined in the config
 */
test("distanceReceived and deltaBetween fixed number of multiple distances to average", () => {
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
 * distanceReceived and deltaBetween edge case.
 * If the lead is changing within the set of POINTS_PER_AVERAGE, 0 should be returned
 */
test("distanceReceived and deltaBetween lead changing", () => {
    // Setup

    // Car 1 ahead
    distanceReceived(1, 0, 50);
    distanceReceived(2, 0, 100);

    // Car 2 ahead
    distanceReceived(1, DISTANCE_INTERVAL, 200);
    distanceReceived(2, DISTANCE_INTERVAL, 150);

    // Car 3 ahead
    distanceReceived(1, DISTANCE_INTERVAL * 2, 300);
    distanceReceived(2, DISTANCE_INTERVAL * 2, 350);

    // Validation
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
 * distanceReceived and toCatchLapBased base case
 */
test("distanceReceived and toCatchLapBased base case", () => {
    distanceReceived(1, DISTANCE_INTERVAL, 50);
    distanceReceived(2, DISTANCE_INTERVAL, 100);
    expect(toCatchLapBased(1, 2, 20, 10))
        .toEqual((100 - 50) / (20 - 10));
});

/**
 * distanceReceived and toCatchLapBased base case
 */
test("distanceReceived and toCatchLapBased base case", () => {
    distanceReceived(34, DISTANCE_INTERVAL * 5, 125);
    distanceReceived(56, DISTANCE_INTERVAL * 5, 225);
    expect(toCatchLapBased(34, 56, 2, 1))
        .toEqual((225 - 125)/(2 - 1));
});

/**
 * distanceReceived and toCatchLapBased complex case.
 * When car 2 isn't catching car 1, -1 should be returned
 */
test("distanceReceived and toCatchLapBased car behind not catching", () => {
    distanceReceived(44, DISTANCE_INTERVAL * 3, 5);
    distanceReceived(77, DISTANCE_INTERVAL * 3, 10);
    expect(toCatchLapBased(44, 77, 1, 2)).toEqual(-1);
});

/**
 * distanceReceived and toCatchLapBased edge case.
 * If the delta between car 1 and car 2 is 0, the laps to catch should be 0 regardless of anything else
 */
test("distanceReceived and toCatchLapBased cars level", () => {
    distanceReceived(123, DISTANCE_INTERVAL * 10, 5);
    distanceReceived(15, DISTANCE_INTERVAL * 10, 5);
    expect(toCatchLapBased(123, 15, 5, 4)).toEqual(0);
    expect(toCatchLapBased(123, 15, 4, 5)).toEqual(0);
    expect(toCatchLapBased(15, 123, 5, 4)).toEqual(0);
    expect(toCatchLapBased(15, 123, 4, 5)).toEqual(0);
});

/**
 * distanceReceived and toCatchLapBased edge case.
 * If car 2 is ahead, -1 should be returned regardless of whether car 1 is catching
 */
test("distanceReceived and toCatchLapBased car 2 ahead", () => {
    distanceReceived(99, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND - 1, 4);
    distanceReceived(101, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND - 1, 3);
    expect(toCatchLapBased(99, 101, 1, 2)).toEqual(-1);
    expect(toCatchLapBased(99, 101, 2, 1)).toEqual(-1);
});

/**
 * distanceReceived and toCatchLapBased complex case.
 * Fractional numbers of laps to catch should work as expected
 */
test("distanceReceived and toCatchLapBased fractional laps to catch", () => {
    distanceReceived(13, DISTANCE_INTERVAL * 17, 10);
    distanceReceived(14, DISTANCE_INTERVAL * 17, 15);
    expect(toCatchLapBased(13, 14, 6, 4)).toEqual((15 - 10)/(6 - 4));
});

/**
 * distanceReceived and toCatchLapBased edge case.
 * If the lead is changing between the two cars, 0 should be returned
 */
test("distanceReceived and toCatchLapBased lead changing", () => {
    // Car 1 ahead
    distanceReceived(1, 0, 50);
    distanceReceived(2, 0, 100);

    // Car 2 ahead
    distanceReceived(1, DISTANCE_INTERVAL, 200);
    distanceReceived(2, DISTANCE_INTERVAL, 150);

    // Car 1 back ahead
    distanceReceived(1, DISTANCE_INTERVAL * 2, 250);
    distanceReceived(2, DISTANCE_INTERVAL * 2, 300);

    expect(toCatchLapBased(1, 2, 50000, 40000)).toEqual(0);
    expect(toCatchLapBased(2, 1, 40000, 50000)).toEqual(0);
})

/**
 * distanceReceived and toCatchLapBased Error checking
 */
test("distanceReceived and toCatchRealTime Error checking", () => {
    distanceReceived(101, DISTANCE_INTERVAL, 15);
    distanceReceived(1, DISTANCE_INTERVAL, 20);
    expect(() => {toCatchRealTime(101, 15, 2345)}).toThrow(Error);
    expect(() => {toCatchRealTime(48, 101, 5789)}).toThrow(Error);
    expect(() => {toCatchRealTime(65, 68, 8900)}).toThrow(Error);
    expect(() => {toCatchRealTime(101, 1, "asdf")}).toThrow(TypeError);
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * If car 2 is ahead at the last delta, -1 should be returned regardless of the other deltas
 */
test("distanceReceived and toCatchRealTime car 2 ahead", () => {
    // Setup, fills all but one of the maximum number of distances
    const maxDistance = AVERAGES_PER_TO_CATCH * POINTS_PER_AVERAGE - 1
    for (let i = 0; i < maxDistance; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i * 100);
        distanceReceived(2, i * DISTANCE_INTERVAL, i * 200);
    }

    // Adds the last element in as switching the positions
    distanceReceived(1, maxDistance * DISTANCE_INTERVAL, maxDistance * 200);
    distanceReceived(2, maxDistance * DISTANCE_INTERVAL, maxDistance * 100);

    // Evaluation
    expect(toCatchRealTime(1, 2, 7890)).toEqual(-1);
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * If car 1 and two have equal distances at the last delta, 0 should be returned regardless of the other deltas
 */
test("distanceReceived and toCatchRealTime equal last distances", () => {
    // Setup, fills all but one of the maximum number of distances
    const maxDistance = AVERAGES_PER_TO_CATCH * POINTS_PER_AVERAGE - 1
    for (let i = 0; i < maxDistance; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i * 100);
        distanceReceived(2, i * DISTANCE_INTERVAL, i * 200);
    }

    // Adds the last element in as switching the positions
    distanceReceived(1, maxDistance * DISTANCE_INTERVAL, maxDistance * 100);
    distanceReceived(2, maxDistance * DISTANCE_INTERVAL, maxDistance * 100);

    // Evaluation
    expect(toCatchRealTime(1, 2, 543)).toEqual(0);
    expect(toCatchRealTime(2, 1, 543)).toEqual(0);
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When there aren't enough deltas to form more than one average, 0 should be returned as the cars are at the start
 */
test("distanceReceived and toCatchRealTime not enough data", () => {
    // Setup, only enough points for one average
    for (let i = 1; i <= POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, DISTANCE_INTERVAL * i, i * 50);
        distanceReceived(2, DISTANCE_INTERVAL * i, i * 100);
    }

    // Validation, should be 0
    expect(toCatchRealTime(1, 2, 123)).toEqual(0);
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When there aren't enough deltas to form more than one average because the 2nd to last set of delta has a different
 * sign (a different car ahead) 0 should be returned
 */
test("distanceReceived and toCatchRealTime not enough data lead change", () => {
    // Setup, POINTS_PER_AVERAGE points where car 2 is ahead
    for (let i = 0; i < POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i * 100);
        distanceReceived(2, i * DISTANCE_INTERVAL, i * 50);
    }

    // POINTS_PER_AVERAGE points where car 1 is ahead
    for (let i = POINTS_PER_AVERAGE; i < 2 * POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i * 50);
        distanceReceived(2, i * DISTANCE_INTERVAL, i * 100);
    }

    expect(toCatchRealTime(1, 2, 3465)).toEqual(0);
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When there aren't enough deltas to make the entire AVERAGES_PER_TO_CATCH set but more than one, the code should
 * take the ones it can
 */
test("distanceReceived and toCatchRealTime not full set of data but enough to calculate", () => {
    // Fills the first set of POINTS_PER_AVERAGE
    let distanceSumOne = 0;
    for (let i = 1; i <= POINTS_PER_AVERAGE; i++) {
        distanceSumOne += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            100);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            200);
    }

    // Fills the second set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2
    let distanceSumTwo = 0;
    for (let i = POINTS_PER_AVERAGE + 1; i <= 2 * POINTS_PER_AVERAGE; i++) {
        distanceSumTwo += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            150);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            200);
    }

    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case
    let mostRecentDelta = 200 - 150;
    let rateOfCatch = (200 - 100) - (200 - 150);
    let averageDistance = POINTS_PER_AVERAGE * DISTANCE_INTERVAL;
    let averageDistanceChange = distanceSumTwo / POINTS_PER_AVERAGE - distanceSumOne / POINTS_PER_AVERAGE;

    expect(toCatchRealTime(1, 2, averageDistance))
        .toEqual((mostRecentDelta / rateOfCatch) *
            (averageDistance / averageDistanceChange));
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When there aren't enough deltas to take the entire AVERAGES_PER_TO_CATCH set but more than two, the code should
 * take the ones it can up to the point where the sign of the delta (or the lead) changes
 */
test("distanceReceived and toCatchRealTime not full set of data but enough to calculate lead change", () => {
    // Fills all but the last two sets having car 2 in front of car 1
    for (let i = 0; i < (AVERAGES_PER_TO_CATCH - 2) * POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, 750);
        distanceReceived(2, i * DISTANCE_INTERVAL, 500);
    }

    // Fills the second to last set of POINTS_PER_AVERAGE
    let distanceSumOne = 0;
    for (let i = (AVERAGES_PER_TO_CATCH - 2) * POINTS_PER_AVERAGE;
         i < POINTS_PER_AVERAGE * (AVERAGES_PER_TO_CATCH - 1); i++) {
        distanceSumOne += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            400);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            500);
    }

    // Fills the last set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2
    let distanceSumTwo = 0;
    for (let i = (AVERAGES_PER_TO_CATCH - 1) * POINTS_PER_AVERAGE;
         i < AVERAGES_PER_TO_CATCH * POINTS_PER_AVERAGE; i++) {
        distanceSumTwo += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            450);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            500);
    }

    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case
    // the averageLapDistance is the distance covered in each delta so no need to do anything more
    let mostRecentDelta = 500 - 450;
    let rateOfCatch = (500 - 400) - (500 - 450);
    let averageDistance = POINTS_PER_AVERAGE * DISTANCE_INTERVAL * 2;
    let averageDistanceChange = distanceSumTwo / POINTS_PER_AVERAGE - distanceSumOne / POINTS_PER_AVERAGE;

    expect(toCatchRealTime(1, 2, averageDistance))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((mostRecentDelta / rateOfCatch) * (averageDistance / averageDistanceChange));
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When there aren't enough deltas to make up a set of POINTS_PER_AVERAGES, the points that are there should be
 * converted into averages by making as many full groups as possible in the normal manner
 * and then leaving the remaining elements as a final group
 */
test("distanceReceived and toCatchRealTime uneven number groups", () => {
    let distanceSumOne = 0;
    // Fills the first set of POINTS_PER_AVERAGE
    for (let i = 0; i < POINTS_PER_AVERAGE; i++) {
        distanceSumOne += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            1000);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            2000)
    }

    // Fills the second set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2.
    // This also has less than the POINTS_PER_AVERAGE but will still form a group with equal weighting to the others
    let distanceSumTwo = 0;
    for (let i = POINTS_PER_AVERAGE; i < 2 * POINTS_PER_AVERAGE - 2; i++) {
        distanceSumTwo += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            1500);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            2000)
    }

    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case
    // the distance gap between the last element in the last 2 deltas (the relevant ones) to figure out the
    // distance multiplier
    let mostRecentDelta = 2000 - 1500;
    let rateOfCatch = (2000 - 1000) - (2000 - 1500);
    let averageDistance = POINTS_PER_AVERAGE * DISTANCE_INTERVAL * 5;
    let averageDistanceChange = distanceSumTwo / (POINTS_PER_AVERAGE - 2) - distanceSumOne / POINTS_PER_AVERAGE;

    expect(toCatchRealTime(1, 2, averageDistance))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((mostRecentDelta / rateOfCatch) * (averageDistance / averageDistanceChange));
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When there aren't enough deltas with the correct sign to make a full set of POINTS_PER_AVERAGES, the points that
 * are there should be converted into averages making as many full groups as possible in the normal manner
 * and then leaving the remaining elements as a final group
 */
test("distanceReceived and toCatchRealTime uneven number group lead change", () => {
    // Fills all but the last two sets having car 2 in front of car 1
    for (let i = 0; i < (AVERAGES_PER_TO_CATCH - 2) * POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL, i * 340);
        distanceReceived(2, i * DISTANCE_INTERVAL, i * 120);
    }

    // Fills the second to last set of POINTS_PER_AVERAGE
    let distanceSumOne = 0;
    for (let i = (AVERAGES_PER_TO_CATCH - 2) * POINTS_PER_AVERAGE;
         i < POINTS_PER_AVERAGE * (AVERAGES_PER_TO_CATCH - 1); i++) {
        distanceSumOne += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL, 100);
        distanceReceived(2, i * DISTANCE_INTERVAL, 200)
    }

    // Fills the last set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2 and not complete
    let distanceSumTwo = 0;
    for (let i = (AVERAGES_PER_TO_CATCH - 1) * POINTS_PER_AVERAGE;
         i < AVERAGES_PER_TO_CATCH * POINTS_PER_AVERAGE - 2; i++) {
        distanceSumTwo += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL, 125);
        distanceReceived(2, i * DISTANCE_INTERVAL, 150)
    }

    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case. Uses
    // the distance gap between the last element in the last 2 deltas (the relevant ones) to figure out the
    // distance multiplier
    let mostRecentDelta = 150 - 125;
    let rateOfCatch = (200 - 100) - (150 - 125);
    let averageDistance = POINTS_PER_AVERAGE * DISTANCE_INTERVAL * 45;
    let averageDistanceChange = distanceSumTwo / (POINTS_PER_AVERAGE - 2) - distanceSumOne / POINTS_PER_AVERAGE;

    expect(toCatchRealTime(1, 2, averageDistance))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((mostRecentDelta / rateOfCatch) * (averageDistance / averageDistanceChange));
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * When the delta covers more distance than a lap, that should still work as expected
 */
test("distanceReceived and toCatchRealTime delta more than lap", () => {
    // Fills the first set of POINTS_PER_AVERAGE
    let distanceSumOne = 0;
    for (let i = 0; i < POINTS_PER_AVERAGE; i++) {
        distanceSumOne += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            1500);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            2500)
    }

    // Fills the second set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2
    let distanceSumTwo = 0;
    for (let i = POINTS_PER_AVERAGE; i < 2 * POINTS_PER_AVERAGE; i++) {
        distanceSumTwo += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            1500);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            2000)
    }

    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case
    let mostRecentDelta = 2000 - 1500;
    let rateOfCatch = (2500 - 1500) - (2000 - 1500);
    let averageDistance = POINTS_PER_AVERAGE * DISTANCE_INTERVAL / 2;
    let averageDistanceChange = distanceSumTwo / POINTS_PER_AVERAGE - distanceSumOne / POINTS_PER_AVERAGE;

    expect(toCatchRealTime(1, 2, averageDistance))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((mostRecentDelta / rateOfCatch) * (averageDistance / averageDistanceChange));
});

/**
 * distanceReceived and toCatchRealTime edge case.
 * Ensures that deltas that are 0 are not included in the average for future deltas
 */
test("distanceReceived and toCatchRealTime past zero deltas not included", () => {
    // Fills the first set of POINTS_PER_AVERAGE, both cars equal
    for (let i = 0; i < POINTS_PER_AVERAGE; i++) {
        distanceReceived(1, i * DISTANCE_INTERVAL,
            1500);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            1500)
    }

    // Fills the second set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2
    let distanceSumOne = 0;
    for (let i = POINTS_PER_AVERAGE; i < 2 * POINTS_PER_AVERAGE; i++) {
        distanceSumOne += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL,
            1500);
        distanceReceived(2, i * DISTANCE_INTERVAL,
            2500);
    }

    // Fills the third set of POINTS_PER_AVERAGE, this time making car 1 slower relative to car 2. This is included
    // because otherwise car 1 wouldn't be catching car 2
    let distanceSumTwo = 0;
    for (let i = 2 * POINTS_PER_AVERAGE; i < 3 * POINTS_PER_AVERAGE; i++) {
        distanceSumTwo += i * DISTANCE_INTERVAL;
        distanceReceived(1, i * DISTANCE_INTERVAL, 1500);
        distanceReceived(2, i * DISTANCE_INTERVAL, 2000);
    }

    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case
    // Evaluation. Take the current delta, divide it by the difference between the two deltas as in this case. Uses
    // the distance gap between the last element in the last 2 deltas (the relevant ones) to figure out the
    // distance multiplier
    let mostRecentDelta = 2000 - 1500;
    let rateOfCatch = (2500 - 1500) - (2000 - 1500);
    let averageDistance = POINTS_PER_AVERAGE * DISTANCE_INTERVAL;
    let averageDistanceChange = distanceSumTwo / POINTS_PER_AVERAGE - distanceSumOne / POINTS_PER_AVERAGE;

    expect(toCatchRealTime(1, 2, averageDistance))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((mostRecentDelta / rateOfCatch) * (averageDistance / averageDistanceChange));
});

/**
 * distanceReceived and toCatchRealTime middle case
 */
test("distanceReceived and toCatchRealTime middle case #1", () => {
    // AVERAGES_PER_TO_CATCH sets of averages, at each average car 2 will get 10ms closer to car 1 relatively
    // Stores the delta and distance averages for later processing
    let deltaAverages = [];
    let distanceAverages = [];
    for (let i = 1; i <= AVERAGES_PER_TO_CATCH; i++) {
        let deltaSum = 0;
        let distanceSum = 0;
        for (let j = 1; j <= POINTS_PER_AVERAGE; j++) {
            // Calculates the delta at this point
            deltaSum += ((i * POINTS_PER_AVERAGE + j) * (20 * AVERAGES_PER_TO_CATCH) -
                ((i * POINTS_PER_AVERAGE + j) * (2 * 20 * AVERAGES_PER_TO_CATCH) - i * 10));
            // Calculates the distance sum at this point. This distance - the last distance
            distanceSum += ((i * POINTS_PER_AVERAGE + j) * DISTANCE_INTERVAL);
            distanceReceived(10, (i * POINTS_PER_AVERAGE +
                j) * DISTANCE_INTERVAL, (i * POINTS_PER_AVERAGE + j) * (20 * AVERAGES_PER_TO_CATCH));
            // Start with car 2 2x behind relatively, for each i decrease that by 10ms
            distanceReceived(20, (i * POINTS_PER_AVERAGE + j) * DISTANCE_INTERVAL,
                (i * POINTS_PER_AVERAGE + j) * (2 * 20 * AVERAGES_PER_TO_CATCH) - i * 10);
        }
        // Computes the delta and distance averages
        deltaAverages[i - 1] = (deltaSum / POINTS_PER_AVERAGE);
        distanceAverages[i - 1] = (distanceSum / POINTS_PER_AVERAGE);
    }

    // Reduces the deltaAverages and distanceAverages
    let deltaRateOfChange = 0;
    for (let i = 1; i < deltaAverages.length; i++) {
        deltaRateOfChange += deltaAverages[i] - deltaAverages[i - 1];
    }
    deltaRateOfChange /= (deltaAverages.length - 1);
    let distanceRateOfChange = 0;
    for (let i = 1; i < distanceAverages.length; i++) {
        distanceRateOfChange += distanceAverages[i] - distanceAverages[i - 1];
    }
    distanceRateOfChange /= (distanceAverages.length - 1);

    let averageLap = AVERAGES_PER_TO_CATCH / 3;

    expect(toCatchRealTime(10, 20, averageLap))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((deltaAverages[deltaAverages.length - 1] / deltaRateOfChange) *
            (averageLap / distanceRateOfChange));
});

/**
 * distanceReceived and toCatchRealTime middle case
 */
test("distanceReceived and toCatchRealTime middle case #2", () => {
    // AVERAGES_PER_TO_CATCH sets of averages, at each average car 2 will get 50ms closer to car 1 relatively
    // Stores the delta and distance averages for later processing
    let deltaAverages = [];
    let distanceAverages = [];
    for (let i = 1; i <= AVERAGES_PER_TO_CATCH; i++) {
        let deltaSum = 0;
        let distanceSum = 0;
        for (let j = 1; j <= POINTS_PER_AVERAGE; j++) {
            // Calculates the delta at this point
            deltaSum += ((i * POINTS_PER_AVERAGE + j) * (400 * AVERAGES_PER_TO_CATCH) -
                ((i * POINTS_PER_AVERAGE + j) * (4 * 400 * AVERAGES_PER_TO_CATCH) - i * 50));
            // Calculates the distance sum at this point. This distance - the last distance
            distanceSum += ((i * POINTS_PER_AVERAGE + j) * DISTANCE_INTERVAL);
            distanceReceived(33, (i * POINTS_PER_AVERAGE +
                j) * DISTANCE_INTERVAL, (i * POINTS_PER_AVERAGE + j) * (400 * AVERAGES_PER_TO_CATCH));
            // Start with car 2 2x behind relatively, for each i decrease that by 50ms
            distanceReceived(44, (i * POINTS_PER_AVERAGE + j) * DISTANCE_INTERVAL,
                (i * POINTS_PER_AVERAGE + j) * (4 * 400 * AVERAGES_PER_TO_CATCH) - i * 50);
        }
        // Computes the delta and distance averages
        deltaAverages[i - 1] = (deltaSum / POINTS_PER_AVERAGE);
        distanceAverages[i - 1] = (distanceSum / POINTS_PER_AVERAGE);
    }

    // Reduces the deltaAverages and distanceAverages
    let deltaRateOfChange = 0;
    for (let i = 1; i < deltaAverages.length; i++) {
        deltaRateOfChange += deltaAverages[i] - deltaAverages[i - 1];
    }
    deltaRateOfChange /= (deltaAverages.length - 1);
    let distanceRateOfChange = 0;
    for (let i = 1; i < distanceAverages.length; i++) {
        distanceRateOfChange += distanceAverages[i] - distanceAverages[i - 1];
    }
    distanceRateOfChange /= (distanceAverages.length - 1);

    let averageLap = AVERAGES_PER_TO_CATCH * 4;

    expect(toCatchRealTime(33, 44, averageLap))
        // (Final time for 2 - final time for 1)/(average rate to catch) * (averageLapDistance)/(distance average change)
        .toEqual((deltaAverages[deltaAverages.length - 1] / deltaRateOfChange) *
            (averageLap / distanceRateOfChange));
});
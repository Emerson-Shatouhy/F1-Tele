/**
 * Contains the code for adding data-points to be used to calculate deltas and the code for calculating deltas
 * @type {{reset: reset,
 * distanceReceived: distanceReceived,
 * deltaBetween: (function(int, int)),
 * hasDriver: (function(int): boolean)}} Functions for interfacing with storage and calculating deltas
 * @author https://github.com/Landaman
 */
module.exports = {
    distanceReceived: distanceReceived,
    deltaBetween: deltaBetween,
    reset: reset,
    hasDriver: hasDriver,
    toCatchRealTime: toCatchRealTime,
    toCatchLapBased: toCatchLapBased
}

/**
 * See config.json for configuration options.
 * DISTANCE_INTERVAL     is how often distances should be saved. Lower is more accurate but more variable,
 *                       but higher storage and less variable
 * DISTANCE_UPPER_BOUND  is how far away distances can be from DISTANCE_INTERVAL to be accepted. Higher leads to more
 *                       data, but accepted data may be less accurate. Lower may lead to insufficient data
 * POINTS_PER_AVERAGE    is how many data-points will be averaged for the delta calculation. Higher is more storage and
 *                       accuracy but may reduce variability. Lower increases variability and decreases storage
 * AVERAGES_PER_TO_CATCH is how many delta average sets should be used to calculate the number of laps to catch. Higher
 *                       is more storage and accuracy but may reduce variability. Lower increases variability and
 *                       decreases storage
 */
const {DISTANCE_INTERVAL, DISTANCE_UPPER_BOUND, POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} =
    require('../../../config.json');
const IS_NODE = (typeof window === "undefined" || typeof document === "undefined");

let timeMap = new Map(); // carIndex -> Map (distance -> time)
let worker; // Stores the cleanup worker
let workerRunning = IS_NODE; // Weather or not the worker is currently working. Defaults to off (true) if Node.js

/**
 * To be called whenever a LapData packet is received. Will automatically filter relevant distances
 * @param {Number} driverIndex the index of the driver the packet is from
 * @param {Number} distance the total distance covered by that driver according to the session packet
 * @param {Number} time total time in milliseconds. If this is not total time, circumstances may arise where one driver
 * has a very low time and one has a very high time (be on different laps) for distances that are considered identical
 * which may produce a completely incorrect delta
 * @throws {TypeError} if driverIndex, distance, and time aren't all numbers
 */
function distanceReceived(driverIndex, distance, time) {
    if (isNaN(driverIndex) || isNaN(distance) || isNaN(time)) {
        throw new TypeError("driverIndex, distance, and time must all be numbers");
    }
    // Ignores irrelevant distances
    if (distance % DISTANCE_INTERVAL > DISTANCE_UPPER_BOUND) {
        return;
    } else {
        // This generalizes the distance, which makes later calculations easier
        distance = Math.floor(distance / DISTANCE_INTERVAL);
    }

    if (!timeMap.has(driverIndex)) {
        timeMap.set(driverIndex, new Map()); // Adds the nested map if necessary
    }

    timeMap.get(driverIndex).set(distance, time);

    // Starts the worker if possible
    if (!workerRunning) {
        setupWorker();
    }
}

/**
 * Returns the delta, in milliseconds, between driver one and driver two. Will be negative if driver one is ahead,
 * positive if driver two is ahead. Assumes both drivers already have been logged at least once
 * @param driverOne {int} the index of the first driver
 * @param driverTwo {int} the index of the second driver
 * @return {Number} the delta, in milliseconds, between drivers one and two
 * @throws {Error} if one or both drivers haven't been initialized
 */
function deltaBetween(driverOne, driverTwo) {
    // If both drivers aren't here, no work to be done
    if (!(timeMap.has(driverOne) && timeMap.has(driverTwo))) {
        throw new Error("One or both drivers haven't been initialized");
    }

    return deltaAverageAtCommonPoint(driverOne, driverTwo, -1);
}

/**
 * Calculates the delta using the POINTS_PER_AVERAGE number of data-points, at a given multiple in the set of common
 * data shared by the two drivers. Assumes both drivers exist
 * @param driverOne {int} the index of the first driver
 * @param driverTwo {int} the index of the second driver
 * @param multiple {int} the multiple of POINTS_PER_AVERAGE to use. May be negative 0
 * @returns {number} the delta, in milliseconds, between drivers one and two. Will be negative if driver one is ahead,
 * positive if driver two is ahead.
 */
function deltaAverageAtCommonPoint(driverOne, driverTwo, multiple) {
    let oneMap = timeMap.get(driverOne);
    let twoMap = timeMap.get(driverTwo);
    let biggerMap = oneMap.size > twoMap.size ? oneMap : twoMap;
    let biggerDistanceArray = Array.from(biggerMap.keys());
    let commonElements =
        biggerDistanceArray.filter((element) => {
            return oneMap.has(element) && twoMap.has(element);
        });

    // This gets the relevant range from the multiple
    if (multiple === 1 || multiple === -1) {
        // If 1 or -1, it's just that to the beginning/end
        commonElements = commonElements.slice(multiple * POINTS_PER_AVERAGE);
    } else if (multiple > 1) {
        // If it's greater than 1, it's multiple-1 -> multiple
        commonElements = commonElements.slice((multiple - 1) * POINTS_PER_AVERAGE, multiple * POINTS_PER_AVERAGE);
    } else if (multiple < -1) {
        // If it's less than -1, it's multiple -> multiple +1 (1 closer to 0/the end)
        commonElements = commonElements.slice(multiple * POINTS_PER_AVERAGE, (multiple + 1) * POINTS_PER_AVERAGE);
    }
    // No else clause, if it's 0 we just get everything

    // Now we take the deltas for each distance here, and then average them
    let deltaSum = 0;
    for (let i = 0; i < commonElements.length; i++) {
        deltaSum += oneMap.get(commonElements[i]) - twoMap.get(commonElements[i]);
    }

    return deltaSum / commonElements.length;
}

/**
 * Estimates the number of laps it will take driverTwo to catch driverOne, calculated in real time based on
 * the rate of change of the drivers deltas. If driverTwo isn't catching or is ahead, returns -1
 * @param driverOne {int} the index of the driver ahead
 * @param driverTwo {int} the index of the driver behind
 * @return {Number} the number of laps it will take driverTwo to catch driverOne or -1 if driverTwo isn't catching or
 * driverTwo is ahead
 * @throws {Error} if one or both drivers haven't been initialized
 */
function toCatchRealTime(driverOne, driverTwo) {
    if (!(timeMap.has(driverOne) && timeMap.has(driverTwo))) {
        throw new Error("One or both drivers haven't been initialized");
    }

    // TODO: Write this. This is going to involve using rateOfCatch and its eventual units to get to a lap number

}

/**
 * The rate at which driverTwo is catching driverOne. Assumes both drivers exist
 * @param driverOne {int} the driver ahead
 * @param driverTwo {int} the driver behind
 * @return {Number} the rate at which driverTwo is catching driverOne, or the rate at which driverOne is walking away
 * if that's happening // TODO: Include units here. Not sure what those will be yet
 */
function rateOfCatch(driverOne, driverTwo) {
    let deltas = [];
    for (let i = 1; i <= AVERAGES_PER_TO_CATCH; i++) {
        // TODO: Finish writing this
    }
}

/**
 * The number of laps it will take driverTwo to catch driverOne based on their previous laps. Provides a smoother
 * number compared to toCatchRealTime. If driverTwo isn't catching or is ahead, returns -1
 * @param driverOne {int} the index of the driver ahead
 * @param driverTwo {int} the index of the driver behind
 * @param oneLastLap driverOne's last lap in milliseconds
 * @param twoLastLap driverTwo's last lap in milliseconds
 * @return {Number} the number of laps it will take driverTwo to catch driverOne, or -1 if driverTwo isn't catching or
 * is ahead
 * @throws {Error} if one or both drivers haven't been initialized
 * @throws {TypeError} if oneLastLap or twoLastLap aren't numbers
 */
function toCatchLapBased(driverOne, driverTwo, oneLastLap, twoLastLap) {
    if (!(timeMap.has(driverOne) && timeMap.has(driverTwo))) {
        throw new Error("One or both drivers haven't been initialized");
    }

    if (isNaN(oneLastLap) || isNaN(twoLastLap)) {
        throw new TypeError("oneLastLap and twoLastLap must be the lap time in milliseconds")
    }

    let delta = deltaBetween(driverTwo, driverOne); // This should be how far ahead one is

    // If the delta is 0, return 0 regardless of lap times
    if (delta === 0) {
        return 0;
    }

    // If car two is ahead or two isn't catching one, return -1
    if (delta < 0 || twoLastLap > oneLastLap) {
        return -1;
    }

    return delta / (oneLastLap - twoLastLap);
}

/**
 * Sets up the worker if necessary
 */
function setupWorker() {
// This configures the worker
    if (!worker) {
        worker = new Worker('./delta_calculation.worker.js')
    }

    workerRunning = true;
    worker.postMessage(timeMap);

    /**
     * Handles replies from the worker
     * @param e {MessageEvent} the reply from the worker
     */
    worker.onmessage = function (e) {
        timeMap = e.data;
        workerRunning = false;
    }
}

/**
 * Resets the memory, meant to be used for testing. Clears the timeMap, and resets the worker
 */
function reset() {
    timeMap = new Map();
    worker = null;
    workerRunning = IS_NODE;
}

/**
 * Returns whether the map has the driver stored
 * @param driverIndex {int} the index of the driver to check
 * @returns {boolean} whether or not the map has the driver stored
 */
function hasDriver(driverIndex) {
    return timeMap.has(driverIndex);
}
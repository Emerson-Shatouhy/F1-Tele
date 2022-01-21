/**
 * Contains the code for adding datapoints to be used to calculate deltas and the code for calculating deltas
 * @type {{reset: reset,
 * distanceReceived: distanceReceived,
 * deltaBetween: (function(int, int)),
 * hasDriver: (function(int): boolean)}} Functions for interfacing with storage and calculating deltas
 * @author https://github.com/Landaman
 */
module.exports = {
    distanceReceived : distanceReceived,
    deltaBetween : deltaBetween,
    reset : reset,
    hasDriver : hasDriver
}

/*
See config.json for configuration options.
DISTANCE_INTERVAL is how often distances should be saved. Lower is more accurate but more variable,
                  but higher storage and less variable
DISTANCE_UPPER_BOUND is how far away distances can be from DISTANCE_INTERVAL to be accepted. Higher leads to more data,
                     but accepted data may be less accurate. Lower may lead to insufficient data
COMMON_DATAPOINTS is how many datapoints will be averaged for the delta calculation. Higher is more storage and accuracy
                  but may reduce variability. Lower increases variability and decreases storage
 */
const { DISTANCE_INTERVAL, DISTANCE_UPPER_BOUND, COMMON_DATAPOINTS } = require('../config.json')
const IS_NODE = (typeof window === "undefined" || typeof document === "undefined")

let timeMap = new Map(); // carIndex -> Map (distance -> time)
let worker; // Stores the cleanup worker
let workerRunning = IS_NODE; // Weather or not the worker is currently working. Defaults to off (true) if Node.js

/**
 * To be called whenever a LapData packet is received. Will automatically filter relevant distances
 * @param {Number} driverIndex the index of the driver the packet is from
 * @param {Number} distance the total distance covered by that driver according to the session packet
 * @param {Number} time total time in milliseconds
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
 */
function deltaBetween(driverOne, driverTwo) {
    // If both drivers aren't here, no work to be done
    if (!(timeMap.has(driverOne) && timeMap.has(driverTwo))) {
        throw new Error("One or both drivers haven't been initialized");
    }

    // Here we find the biggest element contained by both and take only the biggest COMMON_DATAPOINTS
    let oneMap = timeMap.get(driverOne);
    let twoMap = timeMap.get(driverTwo);
    let biggerMap = oneMap.size > twoMap.size ? oneMap : twoMap;
    let biggerDistanceArray = Array.from(biggerMap.keys());
    let commonElements =
        biggerDistanceArray.filter((element) => {return oneMap.has(element) && twoMap.has(element);}).
        slice(-COMMON_DATAPOINTS);

    // Now we take the deltas for each distance here, and then average them
    let deltaSum = 0;
    for (let i = 0; i < commonElements.length; i++) {
        deltaSum += oneMap.get(commonElements[i]) - twoMap.get(commonElements[i]);
    }

    return deltaSum / commonElements.length;
}

/**
 * Sets up the worker if necessary
 */
function setupWorker() {
// This configures the worker
    if (!worker) {
        worker = new Worker('./DeltaCleanupWorker.js')
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
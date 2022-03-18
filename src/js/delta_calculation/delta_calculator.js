/**
 * Contains the code for adding data-points to be used to calculate deltas and the code for calculating deltas
 * @type {{toCatchRealTime: ((function(int, int, Number): Number)|*),
 * toCatchLapBased: ((function(int, int, *, *): Number)|*),
 * reset: reset, distanceReceived: distanceReceived,
 * deltaBetween: (function(int, int): number),
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
 * Returns the delta, in milliseconds, between driver one and driver two.
 * Is an average of the last POINTS_PER_AVERAGE deltas. Will be negative if driver one is ahead,
 * positive if driver two is ahead. Will be 0 if the car ahead is changing in the POINTS_PER_AVERAGE set
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

    return deltaAverageAtCommonDistance(driverOne, driverTwo, -1);
}

/**
 * Returns the common distances shared by the two drivers. Assumes they both exist and are instantiated
 * @param driverOne the first driver
 * @param driverTwo the second driver
 * @returns {Number[]} a sorted array of the common distances shared by the two drivers
 */
function commonDistances(driverOne, driverTwo) {
    // Finds the car that has more data, and then gets the elements saved by both
    let oneMap = timeMap.get(driverOne);
    let twoMap = timeMap.get(driverTwo);
    let biggerMap = oneMap.size > twoMap.size ? oneMap : twoMap;
    let biggerDistanceArray = Array.from(biggerMap.keys());
    return biggerDistanceArray.filter((element) => {
        return oneMap.has(element) && twoMap.has(element);
    }).sort((a, b) => {return a - b;});
}

/**
 * Calculates the delta using the POINTS_PER_AVERAGE number of data-points, at a given multiple in the set of common
 * data shared by the two drivers. Assumes both drivers exist. Will be 0 if the lead is changing within the desired set
 * @param driverOne {int} the index of the first driver
 * @param driverTwo {int} the index of the second driver
 * @param multiple {int} the multiple of POINTS_PER_AVERAGE to use. May be negative or 0
 * @returns {number} the delta, in milliseconds, between drivers one and two. Will be negative if driver one is ahead,
 * positive if driver two is ahead.
 */
function deltaAverageAtCommonDistance(driverOne, driverTwo, multiple) {
    // Setup
    let oneMap = timeMap.get(driverOne);
    let twoMap = timeMap.get(driverTwo);
    let commonElements = commonDistances(driverOne, driverTwo);

    // This gets the relevant range from the multiple
    if (multiple === 1 || multiple === -1) {
        // If 1 or -1, it's just that to the beginning/end. We just need to make sure that there is enough elements to
        // grab and if there isn't
        let elementsToGet = commonElements.length % POINTS_PER_AVERAGE === 0 ?
            multiple * POINTS_PER_AVERAGE :
           multiple * (commonElements.length % POINTS_PER_AVERAGE);
        commonElements = commonElements.slice(elementsToGet);
    } else if (multiple > 1) {
        // If it's greater than 1, it's multiple-1 -> multiple
        commonElements = commonElements.slice((multiple - 1) * POINTS_PER_AVERAGE, multiple * POINTS_PER_AVERAGE);
    } else if (multiple < -1) {
        // If it's less than -1, it's multiple -> multiple +1 (1 closer to 0/the end)
        // Since we're slicing from the end, if we don't have the exact number of elements we shift the indexes we are
        // getting over by the amount we're getting so we still end up with the desired group
        let modifier = commonElements.length % POINTS_PER_AVERAGE === 0 ?
            0 : (5 - commonElements.length % POINTS_PER_AVERAGE);
        commonElements = commonElements.slice(multiple * POINTS_PER_AVERAGE + modifier,
            (multiple + 1) * POINTS_PER_AVERAGE + modifier);
    }
    // No else clause, if it's 0 we just get everything

    // Now we take the deltas for each distance here, and then average them. If the signs aren't equal for any,
    // returns 0
    let deltaSum = 0;
    const isNegative = oneMap.get(commonElements[0]) - twoMap.get(commonElements[0]) < 0;
    for (let i = 0; i < commonElements.length; i++) {
        let delta = oneMap.get(commonElements[i]) - twoMap.get(commonElements[i]);
        // Terminates early if there's a sign change, meaning there would be a lead change
        if (isNegative !== delta < 0) {
            return 0;
        }
        deltaSum += delta;
    }

    return deltaSum / commonElements.length;
}

/**
 * Estimates the number of laps it will take driverTwo to catch driverOne, calculated in real time based on
 * the rate of change of the drivers deltas. If driverTwo isn't catching or is ahead, returns -1
 * @param driverOne {int} the index of the driver ahead
 * @param driverTwo {int} the index of the driver behind
 * @param averageLapDistance {Number} the average lap distance around this course
 * @return {Number} the number of laps it will take driverTwo to catch driverOne or -1 if driverTwo isn't catching or
 * driverTwo is ahead
 * @throws {Error} if one or both drivers haven't been initialized
 * @throws {TypeError} if the averageLapDistance isn't a number
 */
function toCatchRealTime(driverOne, driverTwo, averageLapDistance) {
    // Error check one
    if (!(timeMap.has(driverOne) && timeMap.has(driverTwo))) {
        throw new Error("One or both drivers haven't been initialized");
    }

    // Error check two
    if (isNaN(averageLapDistance)) {
        throw new TypeError("averageLapDistance isn't a number");
    }

    // Stores all the deltas, in order from most recent to the least recent
    let distances = commonDistances(driverOne, driverTwo);
    let numGroups = Math.min(Math.ceil(distances.length / POINTS_PER_AVERAGE), AVERAGES_PER_TO_CATCH);
    let delta = [];

    // If the last distance is 0, return 0
    if (timeMap.get(driverOne).get(distances[distances.length - 1]) -
        timeMap.get(driverTwo).get(distances[distances.length - 1]) === 0) {
        return 0;
    }

    // Max either the ceiling of distances.length / POINTS_PER_AVERAGE and less than AVERAGES_PER_TO_CATCH
    for (let i = 1; i <= numGroups; i++) {
        let thisDelta = deltaAverageAtCommonDistance(driverOne, driverTwo, -i);
        // If the delta is positive or zero, ignore it and stop
        if (thisDelta >= 0) {
            // If i = 1, this is the first delta, so we need to return -1 and stop as the wrong car is ahead
            if (i === 1) {
                return -1;
            }
            break;
        }

        // If we've gotten this far, add it to the array
        delta[i - 1] = thisDelta;
    }

    // If this is the case, there isn't enough information
    if (delta.length < 2) {
        return 0;
    }

    numGroups = delta.length; // Sets the number of groups to be the number of deltas as that is the number of used

    // Finds the average rate of change in the deltas
    let deltaAverageCatch = 0;
    for (let i = 1; i < delta.length; i++) {
        deltaAverageCatch += delta[i] - delta[i - 1]
    }
    deltaAverageCatch /= (numGroups - 1);

    // Finds the sums of the distances for each group of POINTS_PER_AVERAGE
    let distanceSums = new Array(Math.ceil(distances.length / POINTS_PER_AVERAGE)).fill(0);
    for (let i = 0; i < distances.length; i++) {
        distanceSums[Math.floor(i/POINTS_PER_AVERAGE)] += distances[i];
    }

    // Filters distanceSums, so we keep only the biggest numGroups distance sums
    distanceSums = distanceSums.filter((element, index) => {
        return index >= distanceSums.length - numGroups;
    })

    // Finds the average rate of change of the distances
    let distanceAverageChange = 0;
    for (let i = 1; i < distanceSums.length; i++) {
        // If it's the last set of distances, the number of distances in the sum
        // might not be POINTS_PER_AVERAGE so this figures that out
        let thisDifference = 0;
        if (i === distanceSums.length - 1) {
            let currentNumberDistances =
                distances.length % POINTS_PER_AVERAGE === 0 ? POINTS_PER_AVERAGE :
                    distances.length % POINTS_PER_AVERAGE;
            thisDifference = distanceSums[i] / currentNumberDistances - distanceSums[i - 1] / POINTS_PER_AVERAGE;
        } else {
            thisDifference = distanceSums[i] / POINTS_PER_AVERAGE - distanceSums[i - 1] / POINTS_PER_AVERAGE;
        }

        distanceAverageChange += thisDifference;
    }
   distanceAverageChange /= (numGroups - 1)

    // Multiply distanceAverageChange by DISTANCE_INTERVAL because that is removed in the storage process
    return Math.abs((delta[0]/deltaAverageCatch)) * (averageLapDistance/(distanceAverageChange * DISTANCE_INTERVAL));
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
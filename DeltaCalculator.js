const { DISTANCE_INTERVAL, DISTANCE_UPPER_BOUND, COMMON_DATAPOINTS } = require('./config.json')
// See DeltaCleanupWorker.js to configure how many common distances will be kept between the cars

let timeMap = new Map(); // carIndex -> Map (distance -> time)
let worker; // Stores the cleanup worker
let workerRunning = false; // Weather or not the worker is currently working

/**
 * To be called whenever a LapData packet is received. Will automatically filter relevant distances
 * @param {Number} driverIndex the index of the driver the packet is from
 * @param {Number} distance the total distance covered by that driver according to the session packet
 * @param {Number} time total time in milliseconds
 */
function distanceReceived(driverIndex, distance, time) {
    // Ignores irrelevant distances
    if (distance % DISTANCE_INTERVAL > DISTANCE_UPPER_BOUND) {
        return;
    } else {
        distance = Math.floor(distance / DISTANCE_INTERVAL); // This generalizes the distance, which makes later calculations easier
    }

    if (!timeMap.has(driverIndex)) {
        timeMap.set(driverIndex, new Map()); // Adds the nested map if necessary
    }

    timeMap.get(driverIndex).set(distance, time);

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
        return -1;
    }

    // Here we find the biggest element contained by both
    let oneMap = timeMap.get(driverOne);
    let twoMap = timeMap.get(driverTwo);
    let biggerMap = oneMap.size > twoMap.size ? oneMap : twoMap;
    let biggerDistanceArray = Array.from(biggerMap.keys());
    let commonElements =
        biggerDistanceArray.filter((element) => {return oneMap.has(element) && twoMap.has(element);}).
        slice(-COMMON_DATAPOINTS);

    let deltaSum = 0;
    // Now we take the deltas for each distance here, and then average them
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

/*
// Test 1, simple case
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(1, DISTANCE_INTERVAL, 5000);
distanceReceived(2, DISTANCE_INTERVAL, 7000);
console.assert(deltaBetween(1, 2) === 5000 - 7000);
console.assert(deltaBetween(2, 1) === 7000 - 5000);

// Test 2, simple case
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(7, DISTANCE_INTERVAL, 9000);
distanceReceived(20, DISTANCE_INTERVAL, 6000);
console.assert(deltaBetween(7, 20) === 9000 - 6000);
console.assert(deltaBetween(20, 7) === 6000 - 9000);

// Test 3, edge case
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(15, DISTANCE_INTERVAL, 10000);
distanceReceived(17, DISTANCE_INTERVAL, 10000);
console.assert(deltaBetween(15, 17) === 10000 - 10000);
console.assert(deltaBetween(17, 15) === 10000 - 10000);

// Test 4, complex case
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(44, 0, 70000);
distanceReceived(44, DISTANCE_INTERVAL, 80000);
distanceReceived(77, 0, 124000);
console.assert(deltaBetween(44, 77) === 70000 - 124000);
console.assert(deltaBetween(77, 44) === 124000 - 70000);

// Test 5, complex case
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(99, 0, 45);
distanceReceived(99, DISTANCE_INTERVAL, 50);
distanceReceived(124, 0, 55);
console.assert(deltaBetween(99, 124) === 45 - 55);
console.assert(deltaBetween(124, 99) === 55 - 45);

// Test 6, tests to make sure distances that aren't relevant are ignored
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND + 1, 123);
console.assert(!timeMap.has(1234));

// Test 7, tests to make sure that distances don't have to be exact
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(1234, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 125);
distanceReceived(1, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2.23, 125);
console.assert(deltaBetween(1234, 1) === 0);
console.assert(deltaBetween(1, 1234) === 0);

// Test 8, tests to make sure that deltas are averaged and not only one
timeMap = new Map();
workerRunning = true; // Disables the cleanup for testing
distanceReceived(123, DISTANCE_INTERVAL, 1);
distanceReceived(124, DISTANCE_INTERVAL + DISTANCE_UPPER_BOUND / 2, 5);
distanceReceived(123, DISTANCE_INTERVAL * 2, 10);
distanceReceived(124, DISTANCE_INTERVAL * 2 + DISTANCE_UPPER_BOUND / 4, 20);
console.assert(deltaBetween(123, 124) === -7);
console.assert(deltaBetween(124, 123) === 7);

// Test 9, tests to make sure that only the correct amount of deltas are averaged and no more
timeMap = new Map();
workerRunning = true; // Disables cleanup for testing
distanceReceived(1, 0, 0);
distanceReceived(2, 0, 50);
for (let i = 1; i <= COMMON_DATAPOINTS; i++) {
    distanceReceived(1, i * DISTANCE_INTERVAL, i);
    distanceReceived(2, i * DISTANCE_INTERVAL, i);
}
console.assert(deltaBetween(1, 2) === 0);
console.assert(deltaBetween(2, 1) === 0);
*/
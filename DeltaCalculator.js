const { Worker } = require('worker_threads');
const DISTANCE_INTERVAL = 100; // How often the program should update delta calculations
// See DeltaCleanupWorker.js to configure how many common distances will be kept between the cars

let timeMap = new Map(); // carIndex -> Map (distance -> time)
let worker; // Stores the cleanup worker

/**
 * To be called whenever a LapData packet is received. Will automatically filter relevant distances
 * @param {int} driverIndex the index of the driver the packet is from
 * @param {int} distance the total distance covered by that driver according to the session packet
 * @param {int} time total time in milliseconds
 */
function distanceReceived (driverIndex, distance, time) {
    // Ignores irrelevant distances
    if (distance % DISTANCE_INTERVAL !== 0) {
        return;
    }

    if (!timeMap.has(driverIndex)) {
        timeMap.set(driverIndex, new Map()); // Adds the nested map if necessary
    }

    timeMap.get(driverIndex).set(distance, time);

    if (!worker) {
        setupWorker();
    }
}

/**
 * Returns the delta, in milliseconds, between driver one and driver two. Will be negative if driver one is ahead,
 * positive if driver two is ahead. Assumes both drivers already have been logged at least once
 * @param driverOne {int} the index of the first driver
 * @param driverTwo {int} the index of the second driver
 * @return {int} the delta, in milliseconds, between drivers one and two
 */
function deltaBetween(driverOne, driverTwo) {
    // First we find the biggest distance value for each driver. The min out of the two will be used
    let oneBiggest = 0;
    timeMap.get(driverOne).forEach(((value, key) => {
        if (key > oneBiggest) {
            oneBiggest = key;
        }
    }))

    let twoBiggest = 0;
    timeMap.get(driverTwo).forEach(((value, key) => {
        if (key > twoBiggest) {
            twoBiggest = key;
        }
    }))

    let usedDistance = Math.min(oneBiggest, twoBiggest);
    let driverOneTime = timeMap.get(driverOne).get(usedDistance);
    let driverTwoTime = timeMap.get(driverTwo).get(usedDistance);

    return driverOneTime - driverTwoTime;

}

/**
 * Sets up the worker if necessary
 */
function setupWorker() {
// This configures the worker
    worker = new Worker('./DeltaCleanupWorker.js', {
        workerData: timeMap
    })

    // When the worker sends back its result, sets the timeMap equal to that
    worker.once('message', (newTimeMap) => {
        timeMap = newTimeMap;
    })

    // When the worker closes, enable another one to be spawned
    worker.once('close', () => {
        worker = null;
    })
}

/*
// Test 1, simple case
timeMap = new Map();
worker = true; // Disables the cleanup for testing
distanceReceived(1, DISTANCE_INTERVAL, 5000);
distanceReceived(2, DISTANCE_INTERVAL, 7000);
console.assert(deltaBetween(1, 2) === 5000 - 7000);
console.assert(deltaBetween(2, 1) === 7000 - 5000)

// Test 2, simple case
timeMap = new Map();
worker = true; // Disables the cleanup for testing
distanceReceived(7, DISTANCE_INTERVAL, 9000);
distanceReceived(20, DISTANCE_INTERVAL, 6000);
console.assert(deltaBetween(7, 20) === 9000 - 6000);
console.assert(deltaBetween(20, 7) === 6000 - 9000);

// Test 3, edge case
timeMap = new Map();
worker = true; // Disables the cleanup for testing
distanceReceived(15, DISTANCE_INTERVAL, 10000);
distanceReceived(17, DISTANCE_INTERVAL, 10000);
console.assert(deltaBetween(15, 17) === 10000 - 10000);
console.assert(deltaBetween(17, 15) === 10000 - 10000);

// Test 4, complex case
timeMap = new Map();
worker = true; // Disables the cleanup for testing
distanceReceived(44, 0, 70000);
distanceReceived(44, DISTANCE_INTERVAL, 80000);
distanceReceived(77, 0, 124000);
console.assert(deltaBetween(44, 77) === 70000 - 124000);
console.assert(deltaBetween(77, 44) === 124000 - 70000);

// Test 5, complex case
timeMap = new Map();
worker = true; // Disables the cleanup for testing
distanceReceived(99, 0, 45);
distanceReceived(99, DISTANCE_INTERVAL, 50);
distanceReceived(124, 0, 55);
console.assert(deltaBetween(99, 124) === 45 - 55);
console.assert(deltaBetween(124, 99) === 55 - 45);

// Test 6, tests to make sure distances that aren't relevant are ignored
timeMap = new Map();
worker = true; // Disables the cleanup for testing
distanceReceived(1234, DISTANCE_INTERVAL + 1, 123);
console.assert(!timeMap.has(1234));
 */
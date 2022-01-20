const { COMMON_DATAPOINTS } = require('./config.json');

/**
 * Handles a message from the parent
 * @param e {MessageEvent} the message from the parent
 */
onmessage = function(e) {
   postMessage(cleanupSet(e.data));
}

/**
 * Cleans up the given map of times
 * @param {Map} map the map of times to clean up
 * @returns {Map} the cleaned up map of times. May be unaltered
 */
function cleanupSet(map) {
    let distancesAllHave = new Set(); // Will hold all the distances held by every car
    let empty = true;
    map.forEach((car) => {
        // If the map is empty, we shouldn't filter and add everything from this car
        if (empty) {
            car.forEach((time, distance) => {
                distancesAllHave.add(distance);
            })
            empty = false;
        } else {
            // Here we filter. If this don't have any value the distancesAllHave map has, we remove it from there
            distancesAllHave.forEach((distance) => {
                if (!car.has(distance)) {
                    distancesAllHave.remove(distance);
                }
            })
        }
    })

    if (distancesAllHave.size > COMMON_DATAPOINTS) {
        let numToRemove = distancesAllHave.size - COMMON_DATAPOINTS;
        for (let i = 0; i < numToRemove; i++) {
            let minimumDistance = null;
            distancesAllHave.forEach((distance) => {
                // Sets the initial value for minimumDistance
                if (minimumDistance === null) {
                    minimumDistance = distance;
                } else {
                    if (distance < minimumDistance) {
                        minimumDistance = distance;
                    }
                }
            })

            distancesAllHave.delete(minimumDistance);
            map.forEach((car) => {
                car.delete(minimumDistance);
            })
        }
    }

    return map;
}

/*
// Test 1, not enough to delete so set should be the same even though they all contain the same values
let testMap1 = new Map();
let copyMap1 = new Map();
testMap1.set(1, new Map());
copyMap1.set(1, new Map());
testMap1.set(2, new Map());
copyMap1.set(2, new Map());
testMap1.set(3, new Map());
copyMap1.set(3, new Map());
testMap1.get(1).set(100, 550);
copyMap1.get(1).set(100, 550);
testMap1.get(2).set(100, 600);
copyMap1.get(2).set(100, 600);
testMap1.get(3).set(100, 700);
copyMap1.get(3).set(100, 700);
testMap1 = cleanupSet(testMap1);
// Hand inspect output using break points

// Test 2, should delete one
let testMap2 = new Map();
testMap2.set(5, new Map());
testMap2.set(6, new Map());
testMap2.set(7, new Map());

for (let i = 0; i <= COMMON_DATAPOINTS; i++) {
    testMap2.get(5).set(i, i + 100);
    testMap2.get(6).set(i, i + 102);
    testMap2.get(7).set(i, i + 104);
}

let copyMap2 = new Map();
copyMap2.set(5, new Map());
copyMap2.get(5).set(0, 100);
copyMap2.set(6, new Map());
copyMap2.get(6).set(0, 102);
copyMap2.set(7, new Map());
copyMap2.get(7).set(0, 104);
testMap2 = cleanupSet(testMap2);
// Hand inspect output using break points

// Test 3, should delete the COMMON_DATAPOINTS constant number
let testMap3 = new Map();
testMap3.set(10, new Map());
testMap3.set(11, new Map());
testMap3.set(12, new Map());

for (let i = 0; i < 2 * COMMON_DATAPOINTS; i++) {
    testMap3.get(10).set(i + 1, i + 200);
    testMap3.get(11).set(i + 1, i + 202);
    testMap3.get(12).set(i+ 1, i + 204);
}

let copyMap3 = new Map();
copyMap3.set(10, new Map());
copyMap3.set(11, new Map());
copyMap3.set(12, new Map());

for (let i = COMMON_DATAPOINTS; i < 2 * COMMON_DATAPOINTS; i++) {
    copyMap3.get(10).set(i + 1, i + 200);
    copyMap3.get(11).set( i + 1, i + 202);
    copyMap3.get(12).set(i + 1, i + 204);
}

testMap3 = cleanupSet(testMap3);
// Hand inspect output using break points
*/
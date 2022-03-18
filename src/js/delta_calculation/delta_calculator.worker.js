/**
 * Runs cleanup on the map from delta_calculator.js. Should be called automatically by delta_calculator.js
 * @type {{cleanupSet: (function(Map): Map)}} cleans up the given map, assuming it follows the correct format
 * @author https://github.com/Landaman
 */
module.exports = {
    cleanupSet: cleanupSet
}

const {POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} = require('../../../config.json');

/**
 * Handles a message from the parent
 * @param e {MessageEvent} the message from the parent
 */
onmessage = function (e) {
    postMessage(cleanupSet(e.data));
}

/**
 * Cleans up the given map of times. Will alter the passed in map and then return it
 * @param {Map} map the map of times to clean up. Must follow the format laid out in delta_calculator.js. This will
 * be altered
 * @returns {Map} the cleaned up map of times. May be unaltered
 * @throws TypeError if the format laid out in delta_calculator.js is not followed
 */
function cleanupSet(map) {
    // Type check
    if (!map instanceof Map) {
        throw new TypeError("map must be a Map");
    }

    let distancesToStore = POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; // Max distances to have in common per car
    let distancesAllHave = new Set(); // Will hold all the distances held by every car
    let empty = true;
    map.forEach((car, carIndex) => {
        // Nested error check 1
        if (!car instanceof  Map) {
            throw new TypeError("Each element in the Map must also be of type Map, according to the specification in " +
                "delta_calculator.js");
        }

        // Nested error check 2
        if (isNaN(carIndex)) {
            throw new TypeError("Each key in the Map must be a number, according to the specification in " +
                "delta_calculator.js")
        }

        car.forEach((time, distance) => {
            // Final nested error check
            if (isNaN(time) || isNaN(distance)) {
                throw new TypeError("Both the keys and values in the nested map must be numbers");
            }
        });

        // If the map is empty, we shouldn't filter and add everything from this car
        if (empty) {
            car.forEach((time, distance) => {
                distancesAllHave.add(distance);
            })
            empty = false;
        } else {
            // Here we filter. If this doesn't have any value the distancesAllHave map has, we remove it from there
            distancesAllHave.forEach((distance) => {
                if (!car.has(distance)) {
                    distancesAllHave.delete(distance);
                }
            })
        }
    })

    // Here we remove older distances if necessary
    let numToRemove = distancesAllHave.size - distancesToStore;
    let allHaveArr = Array.from(distancesAllHave). // This is for efficiency
        sort((a, b) => {
            return a - b;
        });
    for (let i = 0; i < numToRemove; i++) {
        map.forEach((car) => {
            car.delete(allHaveArr[i]);
        })
    }

    return map;
}
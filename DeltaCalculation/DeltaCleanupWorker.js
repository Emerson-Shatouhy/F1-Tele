/**
 * Runs cleanup on the map from DeltaCalculator.js. Should be called automatically by DeltaCalculator.js
 * @type {{cleanupSet: (function(Map): Map)}} cleans up the given map, assuming it follows the correct format
 * @author https://github.com/Landaman
 */
module.exports = {
    cleanupSet : cleanupSet
}

const { COMMON_DATAPOINTS } = require('../config.json');

/**
 * Handles a message from the parent
 * @param e {MessageEvent} the message from the parent
 */
onmessage = function(e) {
   postMessage(cleanupSet(e.data));
}

/**
 * Cleans up the given map of times
 * @param {Map} map the map of times to clean up. Assumed to follow the format laid out in DeltaCalculator.js
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
            // Here we filter. If this doesn't have any value the distancesAllHave map has, we remove it from there
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
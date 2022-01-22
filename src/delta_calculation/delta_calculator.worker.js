/**
 * Runs cleanup on the map from delta_calculator.js. Should be called automatically by delta_calculator.js
 * @type {{cleanupSet: (function(Map): Map)}} cleans up the given map, assuming it follows the correct format
 * @author https://github.com/Landaman
 */
module.exports = {
    cleanupSet: cleanupSet
}

const {POINTS_PER_AVERAGE, AVERAGES_PER_TO_CATCH} = require('../../config.json');

/**
 * Handles a message from the parent
 * @param e {MessageEvent} the message from the parent
 */
onmessage = function (e) {
    postMessage(cleanupSet(e.data));
}

/**
 * Cleans up the given map of times
 * @param {Map} map the map of times to clean up. Assumed to follow the format laid out in delta_calculator.js
 * @returns {Map} the cleaned up map of times. May be unaltered
 */
function cleanupSet(map) {
    let distancesToStore = POINTS_PER_AVERAGE * AVERAGES_PER_TO_CATCH; // Max distances to have in common per car
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
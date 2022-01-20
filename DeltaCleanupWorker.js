const OLD_DISTANCES_KEPT = 5; // Number of distances that should be kept in common between all cars

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

    if (distancesAllHave.size > OLD_DISTANCES_KEPT) {
        let numToRemove = distancesAllHave.size - OLD_DISTANCES_KEPT;
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

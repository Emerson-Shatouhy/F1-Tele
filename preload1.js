const { F1TelemetryClient } = require('f1-2021-udp');
const client= new F1TelemetryClient({port:20770, address:'130.215.225.93'});
var curDriver = 0;
var lobbyInit = false;
var driverSet = false;
var activeDriverID = [];

// motion 
client.on('motion',function(data) {
    
})

// session 
client.on('session',function(data) {
    
})

// lap data 
client.on('lapData',function(data) {
    if(driverSet){
    for(var i = 0; i < 20; i++){
        if(isDriverRunning(i))
        updatePos(data, i);
    }
    }
})

// event 
client.on('event',function(data) {
    
})

// participants 
client.on('participants',function(data) {
    for(var i = 0; i < 20; i++){
        if(!driverSet){
            driverInit(data.m_participants[i].m_name, i);
        }
    }
    driverSet = true;
})

// car setup 
client.on('carSetups',function(data) {
    
})

// car telemetry 
client.on('carTelemetry',function(data) {

})

// car status 
client.on('carStatus',function(data) {
    if(lobbyInit){
    for(var i = 0; i < 20; i++){
        if(isDriverRunning(i))
            tireSet(data, i);
    }
}
})

// final classification 
client.on('finalClassification',function(data) {
    
})

// lobby info 
client.on('lobbyInfo',function(data) {
})

// car damage 
client.on('carDamage',function(data) {
    
})

// session history
client.on('sessionHistory',function(data) {
    
})

client.start();

/* Setups Driver info */
function driverInit(name, i){
    activeDriverID.push(i);
    var table = document.getElementById("dTable");
    var tbody = document.getElementById('dTable').getElementsByTagName('tbody')[0];
    var x = tbody.rows.length;
    var row = tbody.insertRow(x++);
    var cell = row.insertCell(0);
    cell.id = "D" + i;
    var cell2 = row.insertCell(1);
    cell.innerHTML = i;
    cell2.id = "DN" + i;
    cell2.innerHTML = '<i class="bi bi-file-fill"></i>' + name;
    cell2.style = "color: black";
    var cell3 = row.insertCell(2);
    cell3.id = "DT" + i;
    cell3.innerHTML = '<i class="bi bi-dash-circle-fill"></i>';
    var cell4 = row.insertCell(3);
    cell4.id = "TA" + i;
    cell4.innerHTML = '0';

    /* Driver Select Init */
    var dSel = document.getElementById("dSelect");
    var option = document.createElement("option");
    option.text = name;
        option.id = i;
        dSel.add(option);
    lobbyInit = true;
}

/* Updates Tire Information for each driver */
function tireSet(data, i){
    var tire = document.getElementById("TA" + i);
    tire.innerHTML = deltaBetween(i, i+1);
    //tire.innerHTML = data.m_carStatusData[i].m_tyresAgeLaps;
    switch(data.m_carStatusData[i].m_visualTyreCompound){
            case 7:
                document.getElementById("DT" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: green"></i>';
                break;
            case 8:
                document.getElementById("DT" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: blue"></i>';
                break;
            case 16:
                document.getElementById("DT" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: red"></i>';
                break;
            case 17:
                document.getElementById("DT" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: yellow"></i>';
                break;
            case 18:
                document.getElementById("DT" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: white"></i>';
                break;
        }

    }

/* Updates Scoreboard */  
function updatePos(data, i){
    //Delta Check
    distanceReceived(i, data.m_lapData[i].m_totalDistance, data.m_lapData[i].m_currentLapTimeInMS);
    switch(data.m_lapData[i].m_resultStatus){
        case 0:
            document.getElementById("D" + i).innerHTML = "NON";
            removeActiveDriver(i);
            break;
        case 1:
            document.getElementById("D" + i).innerHTML = "INA";
            removeActiveDriver(i);
            break;
        case 2:
            document.getElementById("D" + i).innerHTML = data.m_lapData[i].m_carPosition;
            sortTable();
            break;
        case 3:
            document.getElementById("D" + i).innerHTML = data.m_lapData[i].m_carPosition;
            sortTable();
            break;
        case 4:
            document.getElementById("D" + i).innerHTML = "DNF";
            removeActiveDriver(i);
            break;
        case 5:
            document.getElementById("D" + i).innerHTML = "DSQ";
            removeActiveDriver(i);
            break;
        case 6:
            document.getElementById("D" + i).innerHTML = "NCL";
            removeActiveDriver(i);
            break;
        case 7:
            document.getElementById("D" + i).innerHTML = "RET";
            removeActiveDriver(i);
            break;
    } 
    sortTable();
}

function removeActiveDriver(i){
    activeDriverID.splice(activeDriverID.indexOf(i), 1);
    console.log(activeDriverID);
    table = document.getElementById("dTable");
    var newCell = document.getElementById("DT" + i).parentElement.cloneNode(true);
    table.appendChild(newCell);
    document.getElementById("DT" + i).parentElement.remove();

}



function isNum(val){
    return !isNaN(val)
  }

function isDriverRunning(i){
    return activeDriverID.includes(i);
}

/* Sorts any table numerically*/
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("dTable");
    switching = true;
    while (switching) {
      switching = false;
      rows = table.rows;
      for (i = 1; i < (rows.length - 1); i++) {
        shouldSwitch = false;
        x = rows[i].getElementsByTagName("TD")[0];
        y = rows[i + 1].getElementsByTagName("TD")[0];
        if(isNum(x.innerHTML) || isNum(y.innerHTML)){
            if (Number(x.innerHTML) > Number(y.innerHTML)) {
                shouldSwitch = true;
                break;
              } 
        } 
      }
      if (shouldSwitch) {
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }



  //Delta Update Code Below
  const DISTANCE_INTERVAL = 100.0; // How often the program should update delta calculations
  // What the upper bound on distance % DISTANCE_INTERVAL will be e.g. how close this distance should be to the interval
  // to be counted
  const DISTANCE_UPPER_BOUND = 100.0;
  // See DeltaCleanupWorker.js to configure how many common distances will be kept between the cars
  
  let timeMap = new Map(); // carIndex -> Map (distance -> time)
  let worker; // Stores the cleanup worker
  let workerRunning = false; // Whether or not the worker is currently working
  
  /**
   * To be called whenever a LapData packet is received. Will automatically filter relevant distances
   * @param {Number} driverIndex the index of the driver the packet is from
   * @param {Number} distance the total distance covered by that driver according to the session packet
   * @param {Number} time total time in milliseconds
   */
  function distanceReceived (driverIndex, distance, time) {
      // Ignores irrelevant distances
      if (distance % DISTANCE_INTERVAL > DISTANCE_UPPER_BOUND) {
          return;
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
      if (!(timeMap.has(driverOne) && timeMap.has(driverTwo))) {
          return -1;
      }
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
      if (!worker) {
          worker = new Worker('./DeltaCleanupWorker.js')
      }
  
      workerRunning = true;
      worker.postMessage(timeMap);
  
      /**
       * Handles replies from the worker
       * @param e {MessageEvent} the reply from the worker
       */
      worker.onmessage = function(e) {
          timeMap = e.data;
          workerRunning = false;
      }
  }
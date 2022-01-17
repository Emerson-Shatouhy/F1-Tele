const { F1TelemetryClient } = require('f1-2021-udp');
const client= new F1TelemetryClient({port:20770, /*address:'130.215.124.688'*/});
var curDriver = 0;
var sessionSet = false
//EVENTS BELOW
client.on('carTelemetry',function(data) {
    document.getElementById("accelerator").style.width = data.m_carTelemetryData[curDriver].m_throttle * 100 + "%";
    document.getElementById("brake").style.width = data.m_carTelemetryData[curDriver].m_brake * 100 + "%";
    document.getElementById("revLights").style.width = data.m_carTelemetryData[curDriver].m_revLightsBitValue;
    document.getElementById("engineRPM").style.width = data.m_carTelemetryData[curDriver].m_engineRPM;
    document.getElementById("gear").style.width = data.m_carTelemetryData[curDriver].m_gear;
    document.getElementById("tyreTemp").style.width = data.m_carTelemetryData[curDriver].m_tyresSurfaceTemperature[4];
    document.getElementById("speed").style.width = data.m_carTelemetryData[curDriver].m_speed*.6213;
    document.getElementById("steer").style.width = data.m_carTelemetryData[curDriver].m_steer;
    
});
var run = false;
client.on('participants', function(data) {
    if(run) { return;
    } else {
     for(i=0;i<data.m_participants.length;i++) {
        if(data.m_participants[i].m_name.length > 0) {
            driverInit(data.m_participants[i].m_name, i);
        }
    }
     run = true;
    }
});



client.on('lapData',function(data) {
    document.getElementById("pos").innerHTML = data.m_lapData[curDriver].m_carPosition;
    document.getElementById("lap").innerHTML = data.m_lapData[curDriver].m_currentLapNum;
    
    
})
// Telemetry Update 
function teleUpdate(data){

}


// Initialize the driver list
function driverInit(name, i) {
    /* Driver List Init*/
    var table = document.getElementById("dTable");
    var x = table.rows.length;
    var row = table.insertRow(x++);
    var cell = row.insertCell(0);
    cell.id = "D" + i;
    var cell2 = row.insertCell(1);
    cell.innerHTML = i;
    cell2.innerHTML = name;
    /* Driver Select Init */
    var dSel = document.getElementById("dSelect");
    var option = document.createElement("option");
    option.text = name;
        option.id = i;
        dSel.add(option);
}

//Initialize the Session Information
function sessionInit(data){
//Starting Position Init
if(sessionSet){
    return;
} else {
    //Starting Position Init
    //EMERSON WAS LAZY HERE FIX THIS LATER
for(i=0;i<20;i++) {
    document.getElementById("D" + i).innerHTML = data.m_lapData[i].m_gridPosition;
}
//Session Info Other




}
sessionSet = true;
}

//Updates the Drivers Current Position
function driverUpdate(i, data) {
    document.getElementById("D" + i).innerHTML = data.m_lapData[i].m_carPosition;
    sortTable();
}



document.addEventListener('input', function (event) {
    var dList = document.getElementById("dSelect");
    var id = dList.options[dList.selectedIndex].id;
	if (event.target.id !== 'dSelect') return;
    curDriver= id;
}, false);




function sortTable() {
    console.log("SORT")
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("dTable");
    switching = true;
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /* Loop through all table rows (except the
      first, which contains table headers): */
      for (i = 1; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = rows[i].getElementsByTagName("TD")[0];
        y = rows[i + 1].getElementsByTagName("TD")[0];
        // Check if the two rows should switch place:
        if (Number(x.innerHTML) > Number(y.innerHTML)) {
          // If so, mark as a switch and break the loop:
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }
client.start();
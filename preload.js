const { F1TelemetryClient } = require('f1-2021-udp');
const client= new F1TelemetryClient({port:20770, address:'130.215.225.93'});
var curDriver = 0;
var sessionSet = false;
var run = false;
//EVENTS BELOW

//Motion
client.on('motion',function(data) {
    document.getElementById("xPos").innerHTML = data.m_carMotionData[curDriver].m_worldPositionX;
    document.getElementById("yPos").innerHTML = data.m_carMotionData[curDriver].m_worldPositionY;
    document.getElementById("zPos").innerHTML = data.m_carMotionData[curDriver].m_worldPositionZ;
    document.getElementById("xVel").innerHTML = data.m_carMotionData[curDriver].m_worldVelocityX;
    document.getElementById("yVel").innerHTML = data.m_carMotionData[curDriver].m_worldVelocityY;
    document.getElementById("zVel").innerHTML = data.m_carMotionData[curDriver].m_worldVelocityZ;
})

client.on('session',function(data) {
    document.getElementById("tLap").innerHTML = data.m_totalLaps;
    var sessionType = 0;
    var oldSessionType;
    switch(data.m_sessionType) {
        case 0:
            sessionType = "Unknown";
            break;
        case 1:
            sessionType = "Practice 1";
            break;
        case 2:
            sessionType = "Practice 2";
            break;
        case 3:
            sessionType = "Practice 3";
            break;
        case 4:
            sessionType = "Short Practice";
            break;
        case 5:
            sessionType = "Qualifying 1";
            break;
        case 6:
            sessionType = "Qualifying 2";
            break;
        case 7:
            sessionType = "Qualifying 3";
            break;
        case 8:
            sessionType = "Short Qualifying";
            break;
        case 9:
            sessionType = "One-Shot Qualifying";
            break;
        case 10:
            sessionType = "Race";
            break;
        case 11:
            sessionType = "Time Trial";
            break;
        default:
            sessionType = "Unkown";
            break;
        
    }
    /*if(oldSessionType = sessionType){
        return;
    } else {*/
        document.getElementById("sName").innerHTML = sessionType;
        oldSessionType = sessionType;
        sessionSet  = false;
        //run = false;
    //}

})

client.on('carTelemetry',function(data) {
    document.getElementById("accelerator").style.width = data.m_carTelemetryData[curDriver].m_throttle * 100 + "%";
    document.getElementById("brake").style.width = data.m_carTelemetryData[curDriver].m_brake * 100 + "%";
    //document.getElementById("revLights").style.width = data.m_carTelemetryData[curDriver].m_revLightsBitValue;
    document.getElementById("engineRPM").innerHTML = data.m_carTelemetryData[curDriver].m_engineRPM;
    document.getElementById("gear").innerHTML = data.m_carTelemetryData[curDriver].m_gear;
    //document.getElementById("tyreTemp").style.width = data.m_carTelemetryData[curDriver].m_tyresSurfaceTemperature[4];
    document.getElementById("speed").innerHTML = data.m_carTelemetryData[curDriver].m_speed*.6213;
    //document.getElementById("steer").style.width = data.m_carTelemetryData[curDriver].m_steer;
    
});
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

client.on('carStatus',function(data) {
    for(i=0;i<20;i++) {
        driverUpdate(i, data, true);
    }
})


client.on('lapData',function(data) {
    document.getElementById("cLap").innerHTML = data.m_lapData[curDriver].m_currentLapNum;
    document.getElementById("currT").innerHTML = timeConvert(data.m_lapData[curDriver].m_currentLapTimeInMS);
    document.getElementById("lastT").innerHTML = timeConvert(data.m_lapData[curDriver].m_lastLapTimeInMS);
    document.getElementById("sector1T").innerHTML = data.m_lapData[curDriver].m_sector1TimeInMS * 0.001;
    document.getElementById("sector2T").innerHTML = data.m_lapData[curDriver].m_sector2TimeInMS * 0.001;
    document.getElementById("pLTF").innerHTML = data.m_lapData[curDriver].m_pitLaneTimeInLaneInMS * 0.001;
    document.getElementById("pLTS").innerHTML = data.m_lapData[curDriver].m_pitStopTimerInMS * 0.001;
    sessionInit(data);
    for(i=0;i<20;i++) {
        driverUpdate(i, data, false);
    }
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
    cell2.innerHTML = '<i class="bi bi-file-fill"></i>' + name;
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
    //document.getElementById("D" + i).innerHTML = data.m_lapData[i].m_gridPosition;
}
//Session Info Other




}
sessionSet = true;
}

//Updates the Drivers Current Position and Tire
function driverUpdate(i, data, tire) {
    if(tire){
    switch(data.m_carStatusData[i].m_visualTyreCompound){
        case 7:
            document.getElementById("D" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: green"></i>';
            break;
        case 8:
            document.getElementById("D" + i).innerHTML = '<i class="bi bi-dash-circle-fill" style="color: blue"></i>';
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
    document.getElementById("TA" + i).innerHTML =data.m_carStatusData[i].m_tyresAgeLaps;
    } else {
    document.getElementById("D" + i).innerHTML = data.m_lapData[i].m_carPosition;
    }
    sortTable();
}



document.addEventListener('input', function (event) {
    var dList = document.getElementById("dSelect");
    var id = dList.options[dList.selectedIndex].id;
	if (event.target.id !== 'dSelect') return;
    curDriver= id;
}, false);



//None Event
function sortTable() {
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
function timeConvert(time){
    var seconds = Math.floor(time / 600);  
    var minutes = Math.floor(time / 60000);
    var mSeconds = time % 60;
    return minutes + ":"+ seconds + ":" + mSeconds; 
}

client.start();
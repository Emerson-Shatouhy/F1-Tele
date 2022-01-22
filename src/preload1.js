const {deltaBetween, distanceReceived} = require('./delta_calculation/delta_calculator');
const {F1TelemetryClient} = require('f1-2021-udp');
const client = new F1TelemetryClient({port: 20770, address:/*'130.215.225.93'*/'130.215.124.68'});
var curDriver = 0;
var lobbyInit = false;
var driverSet = false;
var activeDriverID = [];

// motion 
client.on('motion', function (data) {
    //getTireSlip(data);
    //document.getElementById("tSlip").innerHTML = (100/4*(data.m_wheelSlip[1]  + data.m_wheelSlip[2] + data.m_wheelSlip[3] + data.m_wheelSlip[0])).toFixed(1) +"%";
    //FIX
})

// session 
client.on('session', function (data) {
    document.getElementById("tLap").innerHTML = data.m_totalLaps;
    var sessionType = 0;
    switch (data.m_sessionType) {
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
            sessionType = "Unknown";
            break;

    }
    document.getElementById("sName").innerHTML = sessionType;
})

// lap data 
client.on('lapData', function (data) {
    if (driverSet) {
        for (var i = 0; i < 20; i++) {
            if (isDriverRunning(i))
                updatePos(data, i);
            updateLapData(data, i);
        }
    }

})

// event 
client.on('event', function (data) {

})

// participants 
client.on('participants', function (data) {
    for (var i = 0; i < 20; i++) {
        if (!driverSet) {
            driverInit(data.m_participants[i].m_name, i);
        }
    }
    driverSet = true;
})

// car setup 
client.on('carSetups', function (data) {

})

// car telemetry 
client.on('carTelemetry', function (data) {
    if (driverSet) {
        for (var i = 0; i < 20; i++) {
            if (isDriverRunning(i))
                updateCarTelemetry(data, i);
        }
    }
})

// car status 
client.on('carStatus', function (data) {
    if (lobbyInit) {
        for (var i = 0; i < 20; i++) {
            if (isDriverRunning(i))
                tireSet(data, i);
        }
    }
})

// final classification 
client.on('finalClassification', function (data) {

})

// lobby info 
client.on('lobbyInfo', function (data) {
})

// car damage 
client.on('carDamage', function (data) {
    tWearAvg = ((data.m_carDamageData[curDriver].m_tyresWear[0] + data.m_carDamageData[curDriver].m_tyresWear[1] + data.m_carDamageData[curDriver].m_tyresWear[2] + data.m_carDamageData[curDriver].m_tyresWear[3]) / 4).toFixed(1);
    document.getElementById("tWearMax").innerHTML = data.m_carDamageData[curDriver].m_tyresWear[0];
    //document.getElementById("tWearMax").innerHTML = Math.max(data.m_carDamageData[curDriver].m_tyresWear[0], data.m_carDamageData[curDriver].m_tyresWear[1],data.m_carDamageData[curDriver].m_tyresWear[2],data.m_carDamageData[curDriver].m_tyresWear[3]).toFixed(1);
    document.getElementById("tWearAvg").innerHTML = tWearAvg;
    document.getElementById("tWearPerLap").innerHTML = tWearAvg / tAge;
})

// session history
client.on('sessionHistory', function (data) {

})

client.start();

/* Setups Driver info */
function driverInit(name, i) {
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

    var cell5 = row.insertCell(4);
    cell5.id = "DD" + i;
    if (i == curDriver) {
        cell5.innerHTML = "--:--:--";
    } else {
        cell5.innerHTML = deltaBetween(curDriver, i);
    }

    /* Driver Select Init */
    var dSel = document.getElementById("dSelect");
    var option = document.createElement("option");
    option.text = name;
    option.id = i;
    dSel.add(option);
    lobbyInit = true;
}

//Updates lap data
function updateLapData(data, i) {
    document.getElementById("cLap").innerHTML = data.m_lapData[curDriver].m_currentLapNum;
    document.getElementById("currT").innerHTML = timeConvert(data.m_lapData[curDriver].m_currentLapTimeInMS);
    document.getElementById("lastT").innerHTML = timeConvert(data.m_lapData[curDriver].m_lastLapTimeInMS);
    document.getElementById("sector1T").innerHTML = data.m_lapData[curDriver].m_sector1TimeInMS * 0.001.toPrecision(2);
    document.getElementById("sector2T").innerHTML = data.m_lapData[curDriver].m_sector2TimeInMS * 0.001.toPrecision(2);
    document.getElementById("pLTF").innerHTML = data.m_lapData[curDriver].m_pitLaneTimeInLaneInMS * 0.001.toPrecision(2);
    document.getElementById("pLTS").innerHTML = data.m_lapData[curDriver].m_pitStopTimerInMS * 0.001.toPrecision(2);
}

//updates Car Telemetry data
function updateCarTelemetry(data, i) {
    document.getElementById("accelerator").style.width = data.m_carTelemetryData[curDriver].m_throttle * 100 + "%";
    document.getElementById("brake").style.width = data.m_carTelemetryData[curDriver].m_brake * 100 + "%";
    document.getElementById("engineRPM").innerHTML = data.m_carTelemetryData[curDriver].m_engineRPM;
    document.getElementById("gear").innerHTML = data.m_carTelemetryData[curDriver].m_gear;
    document.getElementById("speed").innerHTML = data.m_carTelemetryData[curDriver].m_speed * .6213.toPrecision(2);
}

/* Updates Tire Information for each driver */
function tireSet(data, i) {
    var tire = document.getElementById("TA" + i);
    tAge = data.m_carStatusData[i].m_tyresAgeLaps;
    tire.innerHTML = tAge;
    switch (data.m_carStatusData[i].m_visualTyreCompound) {
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
function updatePos(data, i) {
    //Delta Check
    distanceReceived(i, data.m_lapData[i].m_totalDistance, data.m_lapData[i].m_currentLapTimeInMS);
    if (i == curDriver) {
        document.getElementById("DD" + i).innerHTML = "--:--:--";
    } else {
        document.getElementById("DD" + i).innerHTML = deltaBetween(curDriver, i);
    }
    switch (data.m_lapData[i].m_resultStatus) {
        case 0:
            document.getElementById("D" + i).innerHTML = "NON";
            removeActiveDriver(i);
            break;
        case 1:
            document.getElementById("D" + i).innerHTML = "INA";
            removeActiveDriver(i);
            break;
        case 2:
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

function removeActiveDriver(i) {
    activeDriverID.splice(activeDriverID.indexOf(i), 1);
    console.log(activeDriverID);
    table = document.getElementById("dTable");
    var newCell = document.getElementById("DT" + i).parentElement.cloneNode(true);
    table.appendChild(newCell);
    document.getElementById("DT" + i).parentElement.remove();

}


function isNum(val) {
    return !isNaN(val)
}

function isDriverRunning(i) {
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
            if (isNum(x.innerHTML) || isNum(y.innerHTML)) {
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

//Converts time from MS -> M:S:MS
function timeConvert(time) {
    var seconds = Math.floor(time / 1000);
    var minutes = Math.floor(seconds / 60);
    var mSeconds = time % 60;
    if (seconds > 60) {
        var seconds = seconds - 60;
    }
    return minutes + ":" + seconds + "." + mSeconds.toPrecision(2);
}
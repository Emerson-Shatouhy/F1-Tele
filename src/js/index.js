
var driverNames = [];
var intervalID = setInterval(update, 100);
var tSet = false;
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

function settingsOpen() {
  ('#myModal').modal('show')
}

function update() {
  tableInit(window.electron.participantData());
  updateLapData(window.electron.lapData());
  tireUpdate(window.electron.carStatusData());
  eventUpdate(window.electron.eventData());
}

/**
 * @name tableInit
 * @description initializes the table with driver name and IDs
 * @param {*} data 
 */
function tableInit(data) {
  if (!tSet && data)
    for (var i = 0; i < data.m_participants.length; i++) {
      if (data.m_participants[i].m_name !== "") {
        var table = document.getElementById("dTable");
        var row = table.insertRow(table.rows.length);
        var pos = row.insertCell(0);
        var dName = row.insertCell(1);
        var tire = row.insertCell(2);
        var delta = row.insertCell(3);

        pos.innerHTML = i;
        pos.id = "pos" + i;
        dName.innerHTML = data.m_participants[i].m_name;
        driverNames.push(data.m_participants[i].m_name);
        tire.innerHTML = '<i class="bi bi-dash-circle-fill" style="color: pink"></i>' + ' 00';
        tire.id = "tire" + i;
        delta.innerHTML = '+00:00';
        delta.id = "delta" + i;
      }
      tSet = true;
    }
}

/**
 * @name updateLapData
 * @description updates the lap data in the table
 * @param {*} data 
 */
function updateLapData(data) {
  if (data) {
    for (var i = 0; i < data.m_lapData.length; i++) {
      if (data.m_lapData[i].m_totalDistance > 0) {
        pos = document.getElementById("pos" + i);
        if (data.m_lapData[i].m_carPosition < data.m_lapData[i].m_gridPosition) {
          pos.innerHTML = data.m_lapData[i].m_carPosition + `<i class="bi bi-arrow-up" data-bs-toggle="tooltip" data-bs-placement="top" title="Starting Postion P` + data.m_lapData[i].m_gridPosition + `"></i>`
        } else if (data.m_lapData[i].m_carPosition > data.m_lapData[i].m_gridPosition) {
          pos.innerHTML = data.m_lapData[i].m_carPosition + `<i class="bi bi-arrow-down" data-bs-toggle="tooltip" data-bs-placement="top" title="Starting Postion P` + data.m_lapData[i].m_gridPosition + `"></i>`
        } else if (data.m_lapData[i].m_carPosition == data.m_lapData[i].m_gridPosition) {
          pos.innerHTML = data.m_lapData[i].m_carPosition + `<i class="bi bi-dash-lg" data-bs-toggle="tooltip" data-bs-placement="top" title="Starting Postion P` + data.m_lapData[i].m_gridPosition + `"></i>`
        }
      }
    }
    sortTable();
  }

}
/**
 * @name tireUpdate
 * @description updates the tire status in the table
 * @param {*} data 
 */
function tireUpdate(data) {
  if (data) {
    for (var i = 0; i < data.m_carStatusData.length; i++) {
      if (data.m_carStatusData[i].m_actualTyreCompound !== "") {
        var tire = document.getElementById("tire" + i);
        var tireAge = data.m_carStatusData[i].m_tyresAgeLaps;
        switch (data.m_carStatusData[i].m_visualTyreCompound) {
          case 7:
            tire.innerHTML = '<i class="bi bi-dash-circle-fill" style="color: green"></i>' + '  ' + tireAge;
            break;
          case 8:
            tire.innerHTML = '<i class="bi bi-dash-circle-fill" style="color: blue"></i>' + '  ' + tireAge;
            break;
          case 16:
            tire.innerHTML = '<i class="bi bi-dash-circle-fill" style="color: red"></i>' + '  ' + tireAge;
            break;
          case 17:
            tire.innerHTML = '<i class="bi bi-dash-circle-fill" style="color: yellow"></i>' + '  ' + tireAge;
            break;
          case 18:
            tire.innerHTML = '<i class="bi bi-dash-circle-fill" style="color: white"></i>' + '  ' + tireAge;
            break;
        }
      }
    }
  }
}

function eventUpdate(data) {
  if (!data) return;
  var table = document.getElementById("eTable");
  if(table.rows[1]){
  var firstRow = table.rows[1].cells[0];
  }
  if (!firstRow) {
    var row = table.insertRow(1);
    var time = row.insertCell(0);
    var eventCode = row.insertCell(1);
    var driver = row.insertCell(2);
    var other = row.insertCell(3);
    time.innerHTML = timeConvertS(data.m_header.m_sessionTime);
    eventCode.innerHTML = data.m_eventStringCode;
  }else if (firstRow.innerHTML != timeConvertS(data.m_header.m_sessionTime)) {
    var row = table.insertRow(1);
    var time = row.insertCell(0);
    var eventCode = row.insertCell(1);
    var driver = row.insertCell(2);
    var other = row.insertCell(3);
    time.innerHTML = timeConvertS(data.m_header.m_sessionTime);
    switch (data.m_eventStringCode) {
      case "SSTA":
        eventCode.innerHTML = "Session Start";
        break;
      case "SEND":
        eventCode.innerHTML = "Session End";
        break;
      case "FTLP":
        eventCode.innerHTML = "Fastest Lap";
        console.log(data.m_eventDetails.vehicleIdx)
        break;
      case "RTMT":
        eventCode.innerHTML = "Retirement";
        driver.innerHTML = driverNames[data.Retirement.vehicleIdx];
        break;
      case "DRSE":
        eventCode.innerHTML = "DRS Enabled";
        break;
      case "DRSD":
        eventCode.innerHTML = "DRS Disabled";
        break;
      case "CHQF":
        eventCode.innerHTML = "Chequered Flag";
        break;
      case "RCWN":
        eventCode.innerHTML = "Race Winner";
        driver.innerHTML = driverNames[data.RaceWinner.vehicleIdx];
        break;
      case "PENA":
        eventCode.innerHTML = "Penatly"
        break;
      case "SPTP":
        eventCode.innerHTML = "Speed Trap Triggered";
        console.log(data.SpeedTrap.vehicleIdx);
        driver.innerHTML = driverNames[data.SpeedTrap.vehicleIdx];
        other.innerHTML = Math.round(data.SpeedTrap.speed) + " kmph";
        break;
      case "STLG":
        eventCode.innerHTML = "Starting Lights";
        other.innerHTML = data.StartLIghts.numLights;
        break;
      case "LGOT":
        eventCode.innerHTML = "Lights Out";
        break;
      case "DTSV":
        eventCode.innerHTML = "Drive Through Served";
        driver.innerHTML = driverNames[data.DriveThroughPenaltyServed.vehicleIdx];
        break;
      case "SGSV":
        eventCode.innerHTML = "Stop Go Served";
        driver.innerHTML = driverNames[data.StopGoPenaltyServed.vehicleIdx];
        break;
    }
  }
}



/**
 * @name sortTable
 * @description sorts the table by the position column
 */
function sortTable() {
  var table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("dTable");
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 2; i < (rows.length - 1); i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName("td")[0];
      y = rows[i + 1].getElementsByTagName("td")[0];
      if (isNum(x.innerText) || isNum(y.innerText)) {
        if (Number(x.innerText) > Number(y.innerText)) {
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

/**
 * @name isNum
 * @description checks if the string is a number, what else would it do?
 * @param {*} val 
 * @returns boolean
 */
function isNum(val) {
  return !isNaN(val)
}
/**
 * 
 * @param {int} time 
 * @returns 
 */
function timeConvertMS(time){
  var seconds = Math.floor(time / 1000);
  var minutes = Math.floor(seconds / 60);
  var mSeconds = time % 60;
  if (seconds > 60){
      var seconds = seconds -60;
  }  
  return minutes + ":"+ seconds + "." + mSeconds.toPrecision(2); 
}

function timeConvertS(time){
  var minutes = Math.floor(time / 60);
  var seconds = time-(minutes*60);
  var mSeconds = seconds / 60;
  if (seconds < 10){
      var seconds = "0"+seconds;
  }
  return minutes + ":"+ Math.round(seconds) + "." + mSeconds.toPrecision(2)*100; 
}
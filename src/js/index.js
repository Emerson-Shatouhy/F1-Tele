var intervalID = setInterval(update, 2000);
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
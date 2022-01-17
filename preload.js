const { F1TelemetryClient } = require('f1-2021-udp');
const client= new F1TelemetryClient({port:20770, address:'130.215.124.68'});
var curDriver = 0;
client.on('carTelemetry',function(data) {
    document.getElementById("accelerator").style.width = data.m_carTelemetryData[curDriver].m_throttle * 100 + "%";
    document.getElementById("brake").style.width = data.m_carTelemetryData[curDriver].m_brake * 100 + "%";
});
var run = false;
client.on('participants', function(data) {
    if(run) { return;
    } else {
     for(i=0;i<data.m_participants.length;i++) {
        var dList = document.getElementById("dSelect");
        var option = document.createElement("option");
        option.text = data.m_participants[i].m_name;
        option.id = i;
        dList.add(option);
     }
     run = true;
    }
});

client.on('lapData',function(data) {
    document.getElementById("pos").innerHTML = data.m_lapData[curDriver].m_carPosition;
})


document.addEventListener('input', function (event) {
    var dList = document.getElementById("dSelect");
    var id = dList.options[dList.selectedIndex].id;
	if (event.target.id !== 'dSelect') return;
    curDriver= id;
    console.log(id);
}, false);

client.start();
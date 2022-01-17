const { F1TelemetryClient } = require('f1-2021-udp');
const client= new F1TelemetryClient({port:20770, address:'130.215.124.68'});
var curDriver = 0;
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
    document.getElementById("lap").innerHTML = data.m_lapData[curDriver].m_currentLapNum;
    
    
})


document.addEventListener('input', function (event) {
    var dList = document.getElementById("dSelect");
    var id = dList.options[dList.selectedIndex].id;
	if (event.target.id !== 'dSelect') return;
    curDriver= id;
    console.log(id);
}, false);

client.start();
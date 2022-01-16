const { F1TelemetryClient } = require('f1-2021-udp');
const client= new F1TelemetryClient();
client.on('carTelemetry',function(data) {
    document.getElementById("acclerator").style.width = data.m_carTelemetryData[0].m_throttle * 100 + "%";
    document.getElementById("brake").style.width = data.m_carTelemetryData[0].m_brake * 100 + "%";
})
client.start();

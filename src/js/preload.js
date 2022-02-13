const {
    contextBridge,
    ipcRenderer
} = require('electron')
const {
    F1TelemetryClient
} = require("f1-2021-udp");
const client = new F1TelemetryClient({
    address: '130.215.211.214'
});
let motionD, sessionD, lapD, eventD, participantsD, carSetupsD, cartelemetryD, carStatusD, finalClassificationD, lobbyInfoD, carDamageD, sessionHistoryD;

// Motion
client.on('motion', function (data) {
    motionD = data;
})

// Session
client.on('session', function (data) {
    sessionD = data;
})

// lap Data
client.on('lapData', function (data) {
    lapD = data;
})

// Event
client.on('event', function (data) {
    eventD = data;
})

// Participants
client.on('participants', function (data) {
    participantsD = data;
})

// Car Setups
client.on('carSetups', function (data) {
    carSetupsD = data;
})

// Car Telemetry
client.on('carTelemetry', function (data) {
    cartelemetryD = data;
})

// Car Status
client.on('carStatus', function (data) {
    carStatusD = data;
})

// Final Classification
client.on('finalClassification', function (data) {
    finalClassificationD = data;
})

// Lobby Info
client.on('lobbyInfo', function (data) {
    lobbyInfoD = data;
})

// Car Damage
client.on('carDamage', function (data) {
    carDamageD = data;
})

// Session History
client.on('sessionHistory', function (data) {
    sessionHistoryD = data;
})


//Data Send
contextBridge.exposeInMainWorld(
    'electron', {
        sessionData: () => sessionD,
        motionData: () => motionD,
        lapData: () => lapD,
        eventData: () => eventD,
        participantData: () => participantsD,
        carSetupData: () => carSetupsD,
        carTelemetryData: () => cartelemetryD,
        carStatusData: () => carStatusD,
        finalClassificationData: () => finalClassificationD,
        lobbyInfoData: () => lobbyInfoD,
        carDamageData: () => carDamageD,
        sessionHistoryData: () => sessionHistoryD,
    }
)

client.start();
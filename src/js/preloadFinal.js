const {deltaBetween, distanceReceived} = require('./DeltaCalculation/DeltaCalculator.js');
const {F1TelemetryClient} = require('f1-2021-udp');
const {RECIEVING_IP} =require('../../config.json');
const client = new F1TelemetryClient({port: 20770, address:/*'130.215.225.93'*/'130.215.124.68'}); //Your IP
 //Instance Variables

 // Preload (Isolated World) (Send Information through contextBridge to the HTML docs)
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron',
  {
    doAThing: () => ipcRenderer.send('do-a-thing')
  }
)
/**
 * See config.json for configuraiton options.
 * RECIEVING_IP     the IP address the data is being sent to (your computer)
 */

/**
 * Pulls data from the .CarMotionData[0-21] packet
 */
client.on('motion', function (data) {

    
})

// session 
client.on('session', function (data) {
    

    
})

// lap data 

client.on('lapData',function(data) {
   

})

// event 
client.on('event', function (data) {

})

// participants 
client.on('participants', function (data) {
   
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

client.on('lobbyInfo',function(data) {
  
})

// car damage 
client.on('carDamage',function(data) {
   
})

// session history
client.on('sessionHistory', function (data) {

})

client.start();


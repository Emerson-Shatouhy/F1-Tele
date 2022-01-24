console.log("Preload Active");//testing
const {F1TelemetryClient} = require('f1-2021-udp');
const {RECIEVING_IP} =require('./config.json');
const client = new F1TelemetryClient({port: 20770, address:/*'130.215.225.93'*/RECIEVING_IP}); //Your IP
 //Instance Variables
var packetData = [];
var setPacketData = false;
 // Preload (Isolated World) (Send Information through contextBridge to the HTML docs)
/*const { contextBridge, ipcRenderer } = require('electron');
const Renderer = require('electron/renderer');

contextBridge.exposeInMainWorld('electron',
  {
    doAThing: () => ipcRenderer.send('do-a-thing')
  }
)
*/

/**
 * See config.json for configuraiton options.
 * RECIEVING_IP     the IP address the data is being sent to (your computer)
 */

/**
 * Pulls data from the .CarMotionData[0-21] packet
 * index [0]
 */
client.on('motion', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[0] = data;
    }
    
    
})

// session [1]
client.on('session', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[1] = data;
    } 
})

// lap data [2]

client.on('lapData',function(data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[2] = data;
    }

})

// event [3]
client.on('event', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[3] = data;
    }
})

// participants [4]
client.on('participants', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[4] = data;
    }
})

// car setup [5]
client.on('carSetups', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[5] = data;
    }
})

// car telemetry [6]
client.on('carTelemetry', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[6] = data;
    }
    
})

// car status [7]
client.on('carStatus', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[7] = data;
    }
})

// final classification [8]
client.on('finalClassification', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[8] = data;
    }
})

// lobby info [9]

client.on('lobbyInfo',function(data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[9] = data;
    }
})

// car damage [10]
client.on('carDamage',function(data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[10] = data;
    }
})

// session history [11]
client.on('sessionHistory', function (data) {
    if(!setPacketData){
        packetData.push(data);
    }
    else{
        packetData[11] = data;
    }
})

client.start();
Renderer.render();


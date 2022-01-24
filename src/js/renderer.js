const {deltaBetween, distanceReceived} = require('./DeltaCalculation/DeltaCalculator.js');
const {} =require('../../config.json');
//instance variables:
var curDriver=0; //index value of the driver selected through the drop down


console.log("Renderer Active");
//sets current driver off the drop down list on the right
document.addEventListener('input', function (event) {
    var dList = document.getElementById("dSelect");
    var id = dList.options[dList.selectedIndex].id;
	if (event.target.id !== 'dSelect') return;
    curDriver= id;
    document.getElementById("curDriver").innerHTML = curDriver;
}, false);

function render(){
    document.getElementById("test").innerHTML = window.electron.doThing();
    document.getElementById("test2").innerHTML ="2nd";
}
"use strict";
/*jslint browser: true */

// As a coding exercise, I'm going to opt for simplicity and perspicuity, rather than dealing with out-of-scope
// production issues such as namespace management. Hence no information-hiding by function, class, etc.


/// UTILITIES ///////////////////////////////////////

function isBetween(low, x, high) { // True iff low <= x <= high.
	return (low <= x) && (x <= high);
}

// Make a request. This implementation uses HTTP GET for everything -- even messages with data.
// In fact, all the uses have a query parameter in the path.
function sendMessage(path, callback) {
	// The timestamp is just a hack to make each url unique, so nothing gets cached or suppressed.
	var url = location.origin + path + '&timestamp=' + Date.now();
	var xmlhttp = new XMLHttpRequest(); // Obviously, we could shim ActiveXObject and such as necessary.
	if (callback) {
		xmlhttp.onload = function () {
			var ok = (xmlhttp.status === 200);
			callback(ok ? JSON.parse(xmlhttp.responseText) : xmlhttp.statusText);
		};
	}
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
}


/// APPLICATION LOGIC ///////////////////////////////////////

// Updates the board according to the spec.
function handlePlay(startElement, endElement) {
	var isMove = startElement != endElement;
	if (isMove && (!startElement.innerHTML || endElement.innerHTML)) { return; }
	if (isMove) { startElement.innerHTML = ""; }
	endElement.innerHTML = endElement.innerHTML ? "" : "X";
}

// All the plays come by messages from the server. I would rather use socket.io for this,
// but the problem spec says no third-party libraries. So we'll use long-polling:
// We make a request to the server, but there can be long time before we get answer. When
// we get it, we act on the message and then send another longPoll request.
// The two requests we can make are /longPoll?op=join (get a history back), or /longPoll?op=idle
// (get the next play back back from any of the participants).
function handleMessage(message) {
	function onePlay(data) { // Handle a single play, where data is {start: cellId1, end: cellId2}
		var start = document.getElementById(data.start);
		var end = document.getElementById(data.end);
		if (!start || !end) { return console.error("No element", data); }
		handlePlay(start, end);
	}
	switch (message.op) {
	case 'play':
		onePlay(message.data);
		break;
	case 'history':
		message.data.map(onePlay);
		break;
	default:
		console.error(message);
	}
	sendMessage('/longPoll?op=idle', handleMessage);
}


/// EVENT HANDLING ///////////////////////////////////////

var startElement, lastTouch, cells = [], isFile = location.protocol === 'file:';

// On mobile, we don't get a distinct ending element, so find it based on position.
// If there is a lastTouch, find the cell that encloses it (and clear lastTouch).
// If no touch, answer the dflt.
// Otherwise nothing (e.g., dragged off).
function findLastTouchedElement(dflt) {
	var elt, bounds, x, y, i;
	if (!lastTouch) { return dflt; }
	x = lastTouch.pageX;
	y = lastTouch.pageY;
	lastTouch = undefined; 
	for (i = 0; i < cells.length; i++) {
		elt = cells[i];
		bounds = elt.getBoundingClientRect();
		if (isBetween(bounds.left, x, bounds.right) && isBetween(bounds.top, y, bounds.bottom)) {
			return elt;
		}
	}
}

// Browser event handlers..
// I don't know how seriously to take the instructions that there's "no need to make the UI pretty".
// Is dragging a translucent X merely being pretty, or an essential part of the functionality?
// In any case, this code is where one would implement that sort of thing, which I have deliberately ommited for clarity.
function handleStart() {  // Record startElement.
	startElement = event.target;
	event.preventDefault();
}
function handleDrag() {   // Record lastTouch. Mobile only.
	lastTouch = event.touches[0]; // We only look at the "first" of a multi-touch.
	event.preventDefault();
}
function handleStop() {   // Update the start/end elements per the spec.
	var endElement = findLastTouchedElement(event.target);
	if (!endElement) { return; } // dragged off the grid
	event.preventDefault();

	// When connected to a server, we don't handlePlay just yet.
	// Instead we just tell the server, which broadcasts the play to everyone, including us.
	if (isFile) { // this allows us to test things out without a server
		handlePlay(startElement, endElement);
	} else {  // Not a longPoll message, because it is initiated at random times by us, not the server.
		sendMessage('/play?start=' + startElement.id + '&end=' + endElement.id);
	}
}


/// SETUP ///////////////////////////////////////

// I interpret this challenge as a multi-user/state design problem, not a CSS layout puzzle.
// Additionally, I am not dogmatic about tables. My own inclination, outside of an institutional policy, 
// is to use tables for table-like things, which this is. Thus a table here.
var colNum, rowNum, n = Number(location.hash.slice(1)) || 4, grid = document.createElement('table'), row, cell;
for (rowNum = 0; rowNum < n; rowNum++) {
	row = document.createElement('tr');
	grid.appendChild(row);
	for (colNum = 0; colNum < n; colNum++) {
		cell = document.createElement('td');
		cell.setAttribute('id', colNum + ':' + rowNum);
		// Use same handlers for desktop (mouse events) and mobile (touch events):
		cell.addEventListener('mousedown', handleStart, false);
		cell.addEventListener('touchstart', handleStart, false);
		cell.addEventListener('touchmove', handleDrag, false);
		cell.addEventListener('mouseup', handleStop, false);
		cell.addEventListener('touchend', handleStop, false);
		cells.push(cell); // For use by findLastTouchedElement. Could have used a tag/css query.
		row.appendChild(cell);
	}
}
document.body.appendChild(grid); // last, so there's just one dom change.
if (!isFile) { sendMessage('/longPoll?op=join', handleMessage); }

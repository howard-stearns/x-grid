"use strict";
/*jslint node: true */

// A simple reflector for multi-user grid state.
// "/" (= "/x-grid.html") and "/x-grid.js" are just served directly from the file system.
// "/longPoll" connects a client for a single notification (after which the client will have re-connect with another long poll.
//     ?op=join immediately answers with the history of the board so far. (i.e., all of the plays that have been made).
//     ?op=idle waits until there a play is broadcast, and then answers that play to everyone.
// "/play?start=id1&end=id2" answers {op: 'ok'}, and then broadcasts to all those connected.

var url = require('url');
var http = require('http');     // We could use a route/middleware framework such as express.js, but it's not needed here.
var fs = require('fs');

var history = [], clients = [];

http.createServer(function (incomming, response) {

	var uri = url.parse(incomming.url, true), tempClients, thisPlay, message;
	console.log(new Date().toISOString(), uri.path); // Or use morgan or some such to produce an apache log.

	function answer(client, statusCode, contentType, data) { // Answer the reqest. Generic.
		client.writeHead(statusCode, {'Content-Type': contentType});
		client.end(data);
	}
	function push(client, message) {  // Answer one of our multi-user json messages.
		answer(client, 200, 'application/json', JSON.stringify(message));
	}
	
	switch (uri.pathname) {
	case '/':
	case '/x-grid.html':
	case '/x-grid.js':
		if (uri.pathname === '/') { uri.pathname = '/x-grid.html'; }
		fs.readFile(uri.pathname.slice(1), function (error, data) {
			if (error) { return answer(response, 500, 'text/plain', error.message || error); }
			answer(response, 200, (uri.pathname === '/x-grid.js') ? 'application/javascript' : 'text/html', data);
		});
		break;
	case '/play':
		thisPlay = {start: uri.query.start, end: uri.query.end};
		history.push(thisPlay);
		push(response, {op: 'ok'});
		// Broadcast the move to everyone (including sender);
		message = {op: 'play', data: thisPlay};
		tempClients = clients;
		clients = [];
		tempClients.map(function (client) { push(client, message); });
		break;
	case '/longPoll':
		switch (uri.query.op) {
		case 'join': // new client
			push(response, {op: 'history', data: history}); // and then this client will come back to idle
			break;
		case 'idle': // returning client. They handled a message, and will now wait for the next push.
			clients.push(response); 
			break;
		default:
			push(response, {op: 'error', data: uri.query});
		}
		break;
	default:
		answer(response, 404, 'text/plain', 'Go away');
	}
}).listen(3000, '127.0.0.1');

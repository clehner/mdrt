var log    = require('./lib/log');
var WebSS  = require('ws').Server;
var http   = require('http');
var nb     = require('vim-netbeans');
var marked = require('marked');
var fs     = require('fs');

var fname = process.argv[2];
var server = new nb.VimServer({'port': 8080, 'debug': true});

// debounce, by John Hann
// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
Function.prototype.debounce = function (threshold, execAsap) {
	var func = this, timeout;
	return function debounced() {
		var obj = this, args = arguments;
		function delayed() {
			if (!execAsap)
				func.apply(obj, args);
			timeout = null; 
		}

		if (timeout)
			clearTimeout(timeout);
		else if (execAsap)
			func.apply(obj, args);

		timeout = setTimeout(delayed, threshold || 100); 
	};
};

var handleClient = function(client) {

  var bufferText = '';

  var handleChanges = function() {
    md = marked.parse(bufferText);
    broadcast(md, function(err) {
      if (err) log("> ERR: ", err);
    });
  }.debounce(50);

  client.editFile(fname, function(buffer) {
    buffer.getText(function(text) {
      bufferText = text;
      console.log('hi');
      handleChanges();
    });

    buffer.on("insert", function(offset, text) {
      bufferText = bufferText.substr(0, offset) + text + bufferText.substr(offset);
      handleChanges();
    });

    buffer.on("remove", function(offset, length) {
      bufferText = bufferText.substr(0, offset) + bufferText.substr(offset + length);
      handleChanges();
    })
  });
}

server.on('clientAuthed', handleClient);
server.listen();


var wss = new WebSS( {'port': 9091} );
var sockets = [];
var md = '';

wss.on('connection', function(ws) {
  log("> CONNECTION");
  ws.send(md);
  sockets.push(ws);
  ws.addEventListener('close', function() {
    log("> CLIENT DISCONNECT");
    sockets.splice(sockets.indexOf(ws), 1);
  });
});

var broadcast = function(text, cb) {
  sockets.forEach(function(socket) {
    socket.send(text, cb);
  });
}

var httpServer = http.createServer(function(req, res) {
  var url = req.url;
  if (url !== '/')
    res.end()
  else
    fs.createReadStream('./app.html').pipe(res);
});

httpServer.listen(9090);

const http = require('http');
const WebSocket = require('ws');

const { handleConnection } = require('./sockets/connection');
const { startHeartbeat } = require('./sockets/heartbeat');
const { serveStatic } = require('./static');

const server = http.createServer(serveStatic);

server.on('error', (err) => {
  console.error(`HTTP server error: ${err.message}`);
  process.exit(1);
});

const wss = new WebSocket.Server({ server, maxPayload: 8 * 1024 });

wss.on('error', (err) => {
  console.error(`WebSocket server error: ${err.message}`);
});

wss.on('connection', (socket) => {
  handleConnection(socket, wss);
});

startHeartbeat(wss);

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});

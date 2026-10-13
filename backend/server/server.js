const http = require('http');
const WebSocket = require('ws');

const { handleConnection } = require('./sockets/connection');
const { startHeartbeat } = require('./sockets/heartbeat');

//the backend only speaks websocket ; the frontend is served separately
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Bomberman backend is running (WebSocket only)');
});

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
  console.log('WebSocket server running on ws://localhost:8080');
});

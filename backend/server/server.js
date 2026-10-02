const http = require('http');
const WebSocket = require('ws');

const { handleConnection } = require('./sockets/connection');

const server = http.createServer();

const wss = new WebSocket.Server({ server });

wss.on('connection', (socket) => {
  handleConnection(socket, wss);
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});

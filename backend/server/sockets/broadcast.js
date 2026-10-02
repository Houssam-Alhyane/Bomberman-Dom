const WebSocket = require('ws');

//send single message to a specific socket one-to-one
function send(socket, message) {
  if (socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify(message));
}

//broadcast message to all connected clients one-to-many
function broadcast(wss, message) {
  wss.clients.forEach((client) => {
    send(client, message);
  });
}

module.exports = {
  send,
  broadcast,
};
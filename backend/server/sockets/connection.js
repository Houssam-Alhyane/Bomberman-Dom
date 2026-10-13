const { send } = require('./broadcast');
const { parseMessage } = require('./message');
const { handleMessage } = require('./handlers');
const { createPlayer, removePlayer, roomManager } = require('./state');
const { broadcastRooms, removeFromRoom } = require('./rooms');

function handleConnection(socket, wss) {
  //answered pings keep the heartbeat flag true, see heartbeat.js
  socket.isAlive = true;
  socket.on('pong', () => {
    socket.isAlive = true;
  });

  const player = createPlayer(socket);

  //listener Node turns it into an uncaught exception and the server crashes
  socket.on('error', (err) => {
    console.log(`Socket error for player ${player.id}: ${err.message}`);
    socket.terminate();
  });

  socket.on('message', (data) => {
    const msg = parseMessage(data);

    if (!msg) {
      send(socket, { type: 'error', message: 'Invalid message' });
      return;
    }

    handleMessage(socket, wss, msg);
  });

  socket.on('close', () => {
    removePlayer(player);

    console.log(
      `${player.nickname || `Player ${player.id}`} disconnected`,
    );

    removeFromRoom(wss, player, roomManager);
  });

  console.log(`Player ${player.id} connected`);

  send(socket, {
    type: 'connected',
    playerId: player.id,
  });

  broadcastRooms(wss, roomManager);
}

module.exports = {
  handleConnection,
};

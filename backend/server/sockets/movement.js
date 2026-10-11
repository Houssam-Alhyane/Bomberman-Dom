const { send, broadcastToRoom } = require('./broadcast');

function isValidPosition(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

//the server has no map, it just relays a trusted client position to the room
function move(socket, player, roomManager, msg) {
  if (!player.nickname) {
    send(socket, { type: 'error', message: 'Set a nickname first' });
    return;
  }

  if (!player.roomId) {
    send(socket, { type: 'error', message: 'Join a room first' });
    return;
  }

  const room = roomManager.getRoom(player.roomId);

  if (!room) {
    send(socket, { type: 'error', message: 'Room not found' });
    return;
  }

  if (!isValidPosition(msg.x) || !isValidPosition(msg.y)) {
    send(socket, { type: 'error', message: 'Invalid move' });
    return;
  }

  broadcastToRoom(room, {
    type: 'player_moved',
    playerId: player.id,
    x: msg.x,
    y: msg.y,
  });
}

module.exports = {
  move,
};

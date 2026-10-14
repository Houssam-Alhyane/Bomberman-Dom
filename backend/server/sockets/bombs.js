const { send, broadcastToRoom } = require('./broadcast');

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// resolve the sender's room or report why not
function roomFor(socket, player, roomManager) {
  if (!player.nickname) {
    send(socket, { type: 'error', message: 'Set a nickname first' });
    return null;
  }

  if (!player.roomId) {
    send(socket, { type: 'error', message: 'Join a room first' });
    return null;
  }

  const room = roomManager.getRoom(player.roomId);

  if (!room) {
    send(socket, { type: 'error', message: 'Room not found' });
    return null;
  }

  return room;
}

// relay a bomb placement, the server never simulates the blast
function placeBomb(socket, player, roomManager, msg) {
  const room = roomFor(socket, player, roomManager);
  if (!room) return;

  if (!isValidNumber(msg.x) || !isValidNumber(msg.y) || !isValidNumber(msg.range)) {
    send(socket, { type: 'error', message: 'Invalid bomb' });
    return;
  }

  broadcastToRoom(room, {
    type: 'place_bomb',
    playerId: player.id,
    x: msg.x,
    y: msg.y,
    range: msg.range,
  });
}

// relay a power-up pickup so every client removes it
function powerupCollect(socket, player, roomManager, msg) {
  const room = roomFor(socket, player, roomManager);
  if (!room) return;

  if (!isValidNumber(msg.x) || !isValidNumber(msg.y)) {
    send(socket, { type: 'error', message: 'Invalid pickup' });
    return;
  }

  broadcastToRoom(room, {
    type: 'powerup_collect',
    playerId: player.id,
    x: msg.x,
    y: msg.y,
  });
}

// relay the decided match outcome to the room
function gameOver(socket, player, roomManager, msg) {
  const room = roomFor(socket, player, roomManager);
  if (!room) return;

  broadcastToRoom(room, {
    type: 'game_over',
    winnerId: msg.winnerId ?? null,
  });
}

module.exports = {
  placeBomb,
  powerupCollect,
  gameOver,
};

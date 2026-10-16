const { send, broadcastToRoom } = require('./broadcast');
const { TILE_SIZE, PLAYER_SIZE } = require('../game/map');

// mirror of the client's fixed rules: a fair blast never travels farther and a
// player never holds more live bombs than this, whatever the client claims.
const MAX_RANGE = 10;
const MAX_BOMBS = 8;
const BOMB_TIMER = 3000;

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

// the tile a player centers on: the only tile a bomb may land on.
function tileOf(player) {
  return {
    x: Math.floor((player.x + PLAYER_SIZE / 2) / TILE_SIZE),
    y: Math.floor((player.y + PLAYER_SIZE / 2) / TILE_SIZE),
  };
}

// count a player's bombs that have not gone off yet.
function liveBombs(player) {
  const now = Date.now();
  player.liveBombs = (player.liveBombs || []).filter((at) => now - at < BOMB_TIMER);
  return player.liveBombs.length;
}

// relay a bomb placement, after checking it against the rules we can see.
function placeBomb(socket, player, roomManager, msg) {
  const room = roomFor(socket, player, roomManager);
  if (!room) return;

  // bombs only matter during a running game
  if (room.state !== 'playing' || !room.map) return;

  if (!isValidNumber(msg.x) || !isValidNumber(msg.y) || !isValidNumber(msg.range)) {
    send(socket, { type: 'error', message: 'Invalid bomb' });
    return;
  }

  // a bomb only lands on the sender's own tile
  const tile = tileOf(player);
  if (msg.x !== tile.x || msg.y !== tile.y) {
    send(socket, { type: 'error', message: 'Invalid bomb' });
    return;
  }

  // a bomb never sits on a wall, a block, or off the map
  if (
    !room.map.isInsideMap(msg.x, msg.y) ||
    room.map.isWall(msg.x, msg.y) ||
    room.map.isBlock(msg.x, msg.y)
  ) {
    send(socket, { type: 'error', message: 'Invalid bomb' });
    return;
  }

  // no more live bombs than a fair player can hold
  if (liveBombs(player) >= MAX_BOMBS) {
    send(socket, { type: 'error', message: 'Too many bombs' });
    return;
  }

  // blast range is capped, whatever the client claims
  const range = Math.max(1, Math.min(MAX_RANGE, Math.floor(msg.range)));

  player.liveBombs.push(Date.now());

  broadcastToRoom(room, {
    type: 'place_bomb',
    playerId: player.id,
    x: msg.x,
    y: msg.y,
    range,
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

  // only a player who is actually in this room can be named the winner
  const winnerId = msg.winnerId ?? null;
  if (winnerId !== null && !room.players.some((p) => p.id === winnerId)) {
    return;
  }

  broadcastToRoom(room, {
    type: 'game_over',
    winnerId,
  });
}

module.exports = {
  placeBomb,
  powerupCollect,
  gameOver,
};

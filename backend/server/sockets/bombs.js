const { send, broadcastToRoom } = require('./broadcast');
const { tileOf } = require('../game/grid');
const { BOMB_TIMER } = require('../game/config');

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

// Authoritative bomb placement.
// The server uses its own player stats (bombs capacity, flameRange) and game
// state (live bomb count) — the client cannot choose arbitrary values.
function placeBomb(socket, player, roomManager) {
  const room = roomFor(socket, player, roomManager);
  if (!room) return;

  // bombs only matter during a running game
  if (room.state !== 'playing' || !room.map || !room.gameState) return;

  // dead players can't act
  if (!player.alive) return;

  const gs = room.gameState;

  // a bomb only lands on the sender's own tile (server-side position)
  const tile = tileOf(player);

  // no bomb on a wall, block, or off the map
  if (
    !room.map.isInsideMap(tile.x, tile.y) ||
    room.map.isWall(tile.x, tile.y) ||
    room.map.isBlock(tile.x, tile.y)
  ) {
    return;
  }

  // no stacking: already a bomb on this tile
  if (gs.bombs.some((b) => b.x === tile.x && b.y === tile.y)) {
    return;
  }

  // enforce the player's *server-side* bomb capacity
  const liveCount = gs.bombs.filter((b) => b.ownerId === player.id).length;
  if (liveCount >= player.bombs) {
    return;
  }

  // use the player's *server-side* flame range
  const bomb = {
    id: `bomb-${gs.nextId++}`,
    ownerId: player.id,
    x: tile.x,
    y: tile.y,
    range: player.flameRange,
    timer: BOMB_TIMER,
  };

  gs.bombs.push(bomb);

  broadcastToRoom(room, {
    type: 'place_bomb',
    playerId: player.id,
    x: tile.x,
    y: tile.y,
    range: player.flameRange,
  });
}

module.exports = {
  placeBomb,
};

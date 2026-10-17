// bomb placement: the client asks for a bomb, the server decides

const { send, broadcastToRoom } = require('./broadcast');
const { tileOf } = require('../game/grid');
const { BOMB_TIMER } = require('../game/config');

// resolve the sender's room, or report why not
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

// the client asks, the server decides using its own stats
function placeBomb(socket, player, roomManager) {
  const room = roomFor(socket, player, roomManager);
  if (!room) return;

  // bombs only matter during a running game
  if (room.state !== 'playing' || !room.map || !room.gameState) return;

  // dead players can't act
  if (!player.alive) return;

  const gs = room.gameState;

  // a bomb lands on the sender's own tile, from the server's position
  const tile = tileOf(player);

  // no bomb on a wall, on a block, or off the map
  if (
    !room.map.isInsideMap(tile.x, tile.y) ||
    room.map.isWall(tile.x, tile.y) ||
    room.map.isBlock(tile.x, tile.y)
  ) {
    return;
  }

  // no stacking, one bomb per tile
  if (gs.bombs.some((b) => b.x === tile.x && b.y === tile.y)) {
    return;
  }

  // spend one of the player's own bombs, never a number from the client
  const liveCount = gs.bombs.filter((b) => b.ownerId === player.id).length;
  if (liveCount >= player.bombs) {
    return;
  }

  // range comes from the server's copy of the player, fixed at placement
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

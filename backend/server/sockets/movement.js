const { send, broadcastToRoom } = require('./broadcast');

// A fair client moves speed px per tick (~60 ticks/s).
// MAX_STEP stops a single teleport; BASE_SPEED is the travel budget per second
// at speed=1; MAX_BURST is how much travel can be saved up for a lag spike.
const MAX_STEP = 25; // largest single move (px)
const BASE_SPEED = 100; // px per second at speed=1
const MAX_BURST = 50; // saved-up travel for lag spikes (px)

function isValidPosition(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Token bucket: refills at BASE_SPEED * player.speed px/s, never more than
// one second saved up. Returns false when the move would exceed the allowed
// travel.
function travelAllowed(player, distance) {
  const now = Date.now();
  const elapsed = now - (player.lastMoveAt || now);
  player.lastMoveAt = now;

  const speed = player.speed || 1;
  const maxSpeed = BASE_SPEED * speed;

  player.budget = Math.min(
    MAX_BURST,
    (player.budget ?? MAX_BURST) + (elapsed / 1000) * maxSpeed,
  );

  if (distance > player.budget) return false;

  player.budget -= distance;
  return true;
}

//the server keeps the map and only relays legal positions to the room
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

  // ignore moves outside a running game
  if (room.state !== 'playing' || !room.map) {
    return;
  }

  // dead players cannot move
  if (!player.alive) {
    return;
  }

  if (!isValidPosition(msg.x) || !isValidPosition(msg.y)) {
    send(socket, { type: 'error', message: 'Invalid move' });
    return;
  }

  // reject teleports (single move too large)
  if (
    Math.abs(msg.x - player.x) > MAX_STEP ||
    Math.abs(msg.y - player.y) > MAX_STEP
  ) {
    send(socket, { type: 'error', message: 'Invalid move', x: player.x, y: player.y });
    return;
  }

  // reject moves into walls, blocks or outside the map
  if (!room.map.canMoveTo(msg.x, msg.y)) {
    send(socket, { type: 'error', message: 'Invalid move', x: player.x, y: player.y });
    return;
  }

  // reject moving faster than the game allows (many small moves)
  const distance = Math.hypot(msg.x - player.x, msg.y - player.y);
  if (!travelAllowed(player, distance)) {
    send(socket, { type: 'error', message: 'Slow down', x: player.x, y: player.y });
    return;
  }

  player.x = msg.x;
  player.y = msg.y;

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

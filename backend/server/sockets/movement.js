const { broadcastToRoom } = require('./broadcast');


function move(player, roomManager, msg) {
  const room = roomManager.getRoom(player.roomId);

  if (!room || room.state !== 'playing' || !player.alive) {
    return;
  }

  const dx = msg.dx;
  const dy = msg.dy;

  // only accept -1, 0, or 1 for each axis
  if (![-1, 0, 1].includes(dx) || ![-1, 0, 1].includes(dy)) {
    return;
  }

  // must move in exactly one direction
  if (dx === 0 && dy === 0) {
    return;
  }

  const newX = player.x + dx * player.speed;
  const newY = player.y + dy * player.speed;

  if (!room.map.canMoveTo(newX, newY)) {
    return;
  }

  player.x = newX;
  player.y = newY;

  broadcastToRoom(room, {
    type: 'player_moved',
    playerId: player.id,
    x: player.x,
    y: player.y,
  });
}

module.exports = { move };

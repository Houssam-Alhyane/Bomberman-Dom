const { broadcastToRoom } = require('./broadcast');

function move(socket, player, roomManager, msg) {
    const room = roomManager.getRoom(player.roomId);

    if (!room || room.state !== 'playing' || !player.alive) {
        return;
    }

    if (!room.map.canMoveTo(msg.x, msg.y)) {
        return;
    }

    player.x = msg.x;
    player.y = msg.y;

    broadcastToRoom(room, {
        type: 'player_moved',
        playerId: player.id,
        x: player.x,
        y: player.y,
    });
}

module.exports = { move };
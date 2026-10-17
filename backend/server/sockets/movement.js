

const { send, broadcastToRoom } = require('./broadcast');

// biggest single step we accept, anything larger is treated as a teleport
const MAX_STEP = 25;


function resync(socket, player) {
    send(socket, {
        type: 'error',
        message: 'Invalid move',
        x: player.x,
        y: player.y,
    });
}

function move(socket, player, roomManager, msg) {
    const room = roomManager.getRoom(player.roomId);

    if (!room || room.state !== 'playing' || !player.alive) {
        return;
    }

    if (!Number.isFinite(msg.x) || !Number.isFinite(msg.y)) {
        resync(socket, player);
        return;
    }

    const dx = msg.x - player.x;
    const dy = msg.y - player.y;
    const step = MAX_STEP;

    if ((dx === 0 && dy === 0) || Math.abs(dx) > step || Math.abs(dy) > step) {
        resync(socket, player);
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

const Room = require("../game/room");

const room = new Room();

let nextPlayerId = 1;

function handleConnection(socket) {
    const player = {
        id: nextPlayerId
    };

    nextPlayerId++;

    const added = room.addPlayer(player);

    if (!added) {
        socket.send(JSON.stringify({
            type: "error",
            message: "Room is full"
        }));

        socket.close();
        return;
    }

    console.log(`Player ${player.id} connected`);
    console.log(`Players: ${room.getPlayerCount()}/4`);

    socket.send(JSON.stringify({
        type: "connected",
        playerId: player.id,
        players: room.getPlayerCount()
    }));

    socket.on("close", () => {
        room.removePlayer(player.id);

        console.log(`Player ${player.id} disconnected`);
        console.log(`Players: ${room.getPlayerCount()}/4`);
    });
}

module.exports = {
    handleConnection
};
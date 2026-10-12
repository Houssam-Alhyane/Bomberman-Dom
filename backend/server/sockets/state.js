const RoomManager = require('../game/roomManager');

//single shared room registry for the whole server
const roomManager = new RoomManager();

const players = new Map();
let nextPlayerId = 1;

//build the player object of a fresh connection and remember it
//the player is attached to the socket so handlers can reach it directly
function createPlayer(socket) {
  const player = {
    id: nextPlayerId++,
    nickname: null,
    roomId: null,
    socket,
  };

  socket.player = player;
  players.set(player.id, player);

  return player;
}

function removePlayer(player) {
  players.delete(player.id);
}

//everyone currently connected, used for nickname uniqueness checks
function getPlayerList() {
  return Array.from(players.values());
}

module.exports = {
  roomManager,
  createPlayer,
  removePlayer,
  getPlayerList,
};

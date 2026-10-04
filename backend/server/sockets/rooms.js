const { send, broadcast, broadcastToRoom } = require('./broadcast');

//get a list of players in a room with their id and nickname
function getRoomPlayers(room) {
  return room.players.map((player) => ({
    id: player.id,
    nickname: player.nickname,
  }));
}

//payload a player receives right after entering a room
function getRoomJoined(room, isHost) {
  return {
    type: 'room_joined',
    isHost,
    room: room.getPublicInfo(),
    playersList: getRoomPlayers(room),
  };
}

//broadcast the list of rooms to all connected clients
function broadcastRooms(wss, roomManager) {
  broadcast(wss, {
    type: 'rooms_list',
    rooms: roomManager.getRoomList(),
  });
}

//broadcast the state of a room to all players in that room
function broadcastRoomState(room) {
  broadcastToRoom(room, {
    type: 'room_state',
    room: room.getPublicInfo(),
    players: getRoomPlayers(room),
  });
}

//send an error and return true when the player is already inside a room
function isAlreadyInRoom(socket, player) {
  if (!player.roomId) {
    return false;
  }

  send(socket, { type: 'error', message: 'You are already in a room' });
  return true;
}

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
    gameState: room.getState(),
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

function createRoom(socket, wss, player, roomManager) {
  if (isAlreadyInRoom(socket, player)) {
    return;
  }

  const room = roomManager.createRoom();

  //broadcast every timer/state change
  room.onStateChange = () => broadcastRoomState(room);

  //broadcast the start of the game to all players in the room
  room.onGameStart = () => {
    broadcastToRoom(room, { type: 'start', players: getRoomPlayers(room) });
   
  };

  room.addPlayer(player);
  player.roomId = room.id;

  //the creator is the only member of a new room, so room_joined is enough for them
  send(socket, getRoomJoined(room, true));

  broadcastRooms(wss, roomManager);
}

function joinRoom(socket, wss, player, roomManager, roomId) {
  if (isAlreadyInRoom(socket, player)) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    send(socket, { type: 'error', message: 'Room not found' });
    return;
  }

  if (!room.canJoin()) {
    send(socket, {
      type: 'error',
      message: room.isFull() ? `${room.name} is full` : 'Game already started',
    });
    return;
  }

  if (!room.addPlayer(player)) {
    send(socket, { type: 'error', message: 'Could not join the room' });
    return;
  }

  player.roomId = room.id;

  console.log(`${player.nickname} joined ${room.name}`);

  send(socket, getRoomJoined(room, false));
  broadcastRoomState(room); //everyone gets the new player list

  broadcastRooms(wss, roomManager);
}

//drop the player from his room, destroy the room when nobody is left in it
//returns the name of the room he was in, or null when he was not in one
function removeFromRoom(wss, player, roomManager) {
  const room = player.roomId ? roomManager.getRoom(player.roomId) : null;

  player.roomId = null;

  if (!room) {
    return null;
  }

  const roomName = room.name;

  room.removePlayer(player.id);

  if (room.isEmpty()) {
    roomManager.removeRoom(room.id);
    console.log(`${roomName} removed - no players left`);
  } else {
    broadcastRoomState(room);
  }

  broadcastRooms(wss, roomManager);

  return roomName;
}

//send a message to the player that he has left the room successfully, and remove him from the room
function leaveRoom(socket, wss, player, roomManager) {
  removeFromRoom(wss, player, roomManager);
  send(socket, { type: 'left_room' });
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  removeFromRoom,
  broadcastRooms,
};

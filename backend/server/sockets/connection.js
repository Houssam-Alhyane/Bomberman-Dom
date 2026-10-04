const RoomManager = require('../game/roomManager');
const { joinLobby } = require('./lobby');
const { send } = require('./broadcast');
const {
  createRoom,
  joinRoom,
  leaveRoom,
  removeFromRoom,
  broadcastRooms,
} = require('./rooms');

const roomManager = new RoomManager();

let nextPlayerId = 1;
const players = new Map();

function requireNickname(socket, player) {
  if (player.nickname) {
    return true;
  }

  send(socket, {
    type: 'error',
    message: 'Set a nickname first',
  });

  return false;
}

function handleMessage(socket, wss, player, msg) {
  switch (msg.type) {
    case 'join': {
      const result = joinLobby(
        Array.from(players.values()),
        player,
        msg.nickname,
      );

      if (!result.success) {
        send(socket, { type: 'error', message: result.message });
        return;
      }

      player.nickname = result.nickname;

      console.log(`${player.nickname} joined the lobby`);

      send(socket, {
        type: 'joined',
        playerId: player.id,
        nickname: player.nickname,
      });
      return;
    }

    case 'create_room':
      if (!requireNickname(socket, player)) return;
      createRoom(socket, wss, player, roomManager);
      return;

    case 'join_room':
      if (!requireNickname(socket, player)) return;
      joinRoom(socket, wss, player, roomManager, msg.roomId);
      return;

    case 'leave_room':
      leaveRoom(socket, wss, player, roomManager);
      return;
  }
}

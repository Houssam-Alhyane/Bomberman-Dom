const RoomManager = require('../game/roomManager');
const { joinLobby } = require('./lobby');
const { send } = require('./broadcast');
const { chat } = require('./chat');
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
      // the nickname is set once, a second join must not rename the player
      if (player.nickname) return;

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

    case 'chat':
      chat(socket, player, roomManager, msg.message);
      return;
  }
}

function handleConnection(socket, wss) {
  const player = {
    id: nextPlayerId,
    nickname: null,
    roomId: null,
    socket,
  };

  nextPlayerId++;
  players.set(player.id, player);

  socket.on('message', (data) => {
    let msg;

    try {
      msg = JSON.parse(data.toString());
    } catch (e) {
      send(socket, {
        type: 'error',
        message: 'Invalid message',
      });
      return;
    }

    // JSON.parse gives back null for "null", any
    if (!msg || typeof msg !== 'object') {
      send(socket, {
        type: 'error',
        message: 'Invalid message',
      });
      return;
    }

    handleMessage(socket, wss, player, msg);
  });

  console.log(`Player ${player.id} connected`);

  send(socket, {
    type: 'connected',
    playerId: player.id,
  });

  broadcastRooms(wss, roomManager);

  socket.on('close', () => {
    players.delete(player.id);

    console.log(
      `${player.nickname || `Player ${player.id}`} disconnected`,
    );

    removeFromRoom(wss, player, roomManager);
  });
}

module.exports = {
  handleConnection,
};
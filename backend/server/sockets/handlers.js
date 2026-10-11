const { joinLobby } = require('./lobby');
const { send } = require('./broadcast');
const { chat } = require('./chat');
const { createRoom, joinRoom, leaveRoom } = require('./rooms');
const { move } = require('./movement');
const { roomManager, getPlayerList } = require('./state');

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

function handleJoin(socket, msg) {
  const player = socket.player;

  // the nickname is set once, a second join must not rename the player
  if (player.nickname) return;

  const result = joinLobby(getPlayerList(), player, msg.nickname);

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
}

//route one decoded client message, unknown types are ignored
function handleMessage(socket, wss, msg) {
  const player = socket.player;

  switch (msg.type) {
    case 'join':
      handleJoin(socket, msg);
      return;

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

    case 'move':
      move(socket, player, roomManager, msg);
      return;
  }
}

module.exports = {
  handleMessage,
};

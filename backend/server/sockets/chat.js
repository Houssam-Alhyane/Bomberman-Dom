const { send, broadcast, broadcastToRoom } = require('./broadcast');

const MAX_MESSAGE_LENGTH = 200;
const CHAT_DELAY_MS = 300;

// true when the player sent a message less than 300 ms ago
function chatTooFast(player) {
  const now = Date.now();
  //check if the player has sent a message in the last 300 ms
  if (now - (player.lastChatAt || 0) < CHAT_DELAY_MS) return true;

  player.lastChatAt = now;
  return false;
}

function validateMessage(message) {
  if (typeof message !== 'string') {
    return {
      success: false,
      message: 'Invalid message',
    };
  }

  const cleanMessage = message.trim();

  if (cleanMessage === '') {
    return {
      success: false,
      message: 'Message cannot be empty',
    };
  }

  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      message: `Message must be at most ${MAX_MESSAGE_LENGTH} characters`,
    };
  }

  return {
    success: true,
    message: cleanMessage,
  };
}

function chat(socket, player, roomManager, message) {
  if (!player.nickname) {
    send(socket, { type: 'error', message: 'Set a nickname first' });
    return;
  }

  if (!player.roomId) {
    send(socket, { type: 'error', message: 'Join a room to chat' });
    return;
  }

  const room = roomManager.getRoom(player.roomId);

  if (!room) {
    send(socket, { type: 'error', message: 'Room not found' });
    return;
  }

  //chat stays closed until the room's game is actually running
  if (room.state !== 'playing') {
    send(socket, {
      type: 'error',
      message: 'Chat unlocks when the game starts',
    });
    return;
  }

  const result = validateMessage(message);

  if (!result.success) {
    send(socket, { type: 'error', message: result.message });
    return;
  }

  if (chatTooFast(player)) {
    send(socket, {
      type: 'error',
      message: 'You are sending messages too fast',
    });
    return;
  }

  broadcastToRoom(room, {
    type: 'chat',
    playerId: player.id,
    nickname: player.nickname,
    message: result.message,
  });
}

// Global chat: every connected player sees it, whether or not they are in a
// room or in a running game.
function globalChat(socket, player, wss, message) {
  if (!player.nickname) {
    send(socket, { type: 'error', message: 'Set a nickname first' });
    return;
  }

  const result = validateMessage(message);

  if (!result.success) {
    send(socket, { type: 'error', message: result.message });
    return;
  }

  if (chatTooFast(player)) {
    send(socket, {
      type: 'error',
      message: 'You are sending messages too fast',
    });
    return;
  }

  broadcast(wss, {
    type: 'global_chat',
    playerId: player.id,
    nickname: player.nickname,
    message: result.message,
  });
}

module.exports = {
  chat,
  globalChat,
};

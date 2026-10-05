const { send, broadcastToRoom } = require('./broadcast');

const MAX_MESSAGE_LENGTH = 200;


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

  const result = validateMessage(message);

  if (!result.success) {
    send(socket, { type: 'error', message: result.message });
    return;
  }

  broadcastToRoom(room, {
    type: 'chat',
    playerId: player.id,
    nickname: player.nickname,
    message: result.message,
  });
}

module.exports = {
  chat,
};
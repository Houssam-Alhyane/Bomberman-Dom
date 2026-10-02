function joinLobby(room, player, nickname) {
  if (!nickname || nickname.trim() === '') {
    return {
      success: false,
      message: 'Nickname is required',
    };
  }

  const nicknameExists = room.players.some(
    (player) => player.nickname === nickname,
  );

  if (nicknameExists) {
    return {
      success: false,
      message: 'Nickname already exists',
    };
  }

  player.nickname = nickname;

  return {
    success: true,
    playerCount: room.getPlayerCount(),
  };
}

module.exports = {
  joinLobby,
};

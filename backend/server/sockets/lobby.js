function joinLobby(players, player, nickname) {
  if (typeof nickname !== 'string' || nickname.trim() === '') {
    return {
      success: false,
      message: 'Nickname is required',
    };
  }

  const cleanNickname = nickname.trim();

  const nicknameExists = players.some(
    (other) =>
      other.id !== player.id &&
      other.nickname &&
      other.nickname.toLowerCase() === cleanNickname.toLowerCase(),
  );

  if (nicknameExists) {
    return {
      success: false,
      message: 'Nickname already exists',
    };
  }

  return {
    success: true,
    nickname: cleanNickname,
  };
}

module.exports = {
  joinLobby,
};
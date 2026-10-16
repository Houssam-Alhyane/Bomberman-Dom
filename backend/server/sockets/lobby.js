const { checkNickname } = require('./nickname');

function joinLobby(players, player, nickname) {
  const cleanNickname = checkNickname(players, player, nickname);
  const nicknameExists = players.some(
    (other) =>
      other.id !== player.id &&
      other.nickname &&
      other.nickname.toLowerCase() === cleanNickname.nickname.toLowerCase(),
  );

  if (nicknameExists) {
    return {
      success: false,
      message: 'Nickname already exists',
    };
  }

  return {
    success: true,
    nickname: cleanNickname.nickname,
  };
}

module.exports = {
  joinLobby,
};

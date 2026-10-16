const { checkNickname } = require('./nickname');

function joinLobby(players, player, nickname) {
  //validation first: on failure there is no clean nickname to compare against
  const check = checkNickname(players, player, nickname);

  if (!check.success) {
    return check;
  }

  const nicknameExists = players.some(
    (other) =>
      other.id !== player.id &&
      other.nickname &&
      other.nickname.toLowerCase() === check.nickname.toLowerCase(),
  );

  if (nicknameExists) {
    return {
      success: false,
      message: 'Nickname already exists',
    };
  }

  return {
    success: true,
    nickname: check.nickname,
  };
}

module.exports = {
  joinLobby,
};

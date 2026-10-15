const { checkNickname } = require('./nickname');

function joinLobby(players, player, nickname) {
  return checkNickname(players, player, nickname);
}

module.exports = {
  joinLobby,
  checkNickname,
};

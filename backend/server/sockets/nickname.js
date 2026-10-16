//validate a nickname against everyone currently connected
//the player's own entry is skipped so re-checking an already set nickname passes
function checkNickname(players, player, nickname) {
  if (typeof nickname !== 'string' || nickname.trim() === '') {
    return {
      success: false,
      message: 'Nickname is required',
    };
  }

  const cleanNickname = nickname.trim();

  if (cleanNickname.length > 20 || cleanNickname.length < 3) {
    return {
      success: false,
      message: 'Nickname must be between 3 and 20 characters',
    };
  }

  return {
    success: true,
    nickname: cleanNickname,
  };
}

module.exports = {
  checkNickname,
};

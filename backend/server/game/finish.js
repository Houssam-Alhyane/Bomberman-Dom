
const { stopTicking } = require('./ticking');

//publish the result, then stop the room's tick
function endMatch(room, winnerId, broadcast) {
  const gs = room.gameState;

  gs.finished = true;
  gs.winnerId = winnerId;

  broadcast(room, { type: 'game_over', winnerId });
  stopTicking(room);
}

//finish the game if the room has a game state and it is not already finished
function finishGame(room, broadcast) {
  const gs = room.gameState;
  if (!gs || gs.finished) return;

  const alive = room.players.filter((p) => p.alive);
  // if there is one or zero survivors, the match is over
  endMatch(room, alive.length === 1 ? alive[0].id : null, broadcast);
}

//after a blast: two or more survivors keep playing, one wins, none is a draw
function checkWinner(room, broadcast) {
  const gs = room.gameState;
  if (gs.finished) return;

  const alive = room.players.filter((player) => player.alive);
  if (alive.length > 1) return;
  // if there is one or zero survivors, the match is over
  endMatch(room, alive.length === 1 ? alive[0].id : null, broadcast);
}

module.exports = {
  finishGame,
  checkWinner,
};

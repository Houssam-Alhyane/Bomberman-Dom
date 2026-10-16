// Match outcome: who won, and the two ways a match ends.
//
//   normal - a blast left at most one player alive (checkWinner, from the tick)
//   early  - a player left a running match and only one competitor is left
//            (finishGame, called from removeFromRoom)

const { stopTicking } = require('./ticking');

//publish the result, then stop the room's tick
function endMatch(room, winnerId, broadcast) {
  const gs = room.gameState;

  gs.finished = true;
  gs.winnerId = winnerId;

  broadcast(room, { type: 'game_over', winnerId });
  stopTicking(room);
}

// End the match immediately and tell the room who won.
// Used when the game can no longer continue, e.g. a player left and only one
// competitor is left standing.
function finishGame(room, broadcast) {
  const gs = room.gameState;
  if (!gs || gs.finished) return;

  const remaining = room.players;

  endMatch(room, remaining.length === 1 ? remaining[0].id : null, broadcast);
}

//after a blast: two or more survivors keep playing, one wins, none is a draw
function checkWinner(room, broadcast) {
  const gs = room.gameState;
  if (gs.finished) return;

  const alive = room.players.filter((player) => player.alive);
  if (alive.length > 1) return;

  endMatch(room, alive.length === 1 ? alive[0].id : null, broadcast);
}

module.exports = {
  finishGame,
  checkWinner,
};

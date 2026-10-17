// the win and the lose: who takes the match, and the two ways it can end

const { stopTicking } = require('./ticking');

// publish the result, then stop the room's tick
function endMatch(room, winnerId, broadcast) {
  const gs = room.gameState;

  gs.finished = true;
  gs.winnerId = winnerId;

  broadcast(room, { type: 'game_over', winnerId });
  stopTicking(room);
}

// the early ending, called when someone leaves a running match
function finishGame(room, broadcast) {
  const gs = room.gameState;
  if (!gs || gs.finished) return;

  // count only the living, dead players may still be sitting in the room
  const alive = room.players.filter((p) => p.alive);

  endMatch(room, alive.length === 1 ? alive[0].id : null, broadcast);
}

// the normal ending, after a blast: two or more survivors keep playing
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

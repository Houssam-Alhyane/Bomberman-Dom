// Per-room authoritative game state, plus its id helper.

function newId(gs, prefix) {
  return `${prefix}-${gs.nextId++}`;
}

// initialise the per-room authoritative game state (called from room.startGame)
function initGameState(room) {
  const gs = {
    bombs: [],         // { id, ownerId, x, y, range, timer }
    explosions: [],    // { id, x, y, remaining }
    powerUps: [],      // { id, x, y, type }
    nextId: 1,
    finished: false,
    winnerId: null,
    tickTimer: null,
  };
  room.gameState = gs;
  return gs;
}

module.exports = {
  newId,
  initGameState,
};

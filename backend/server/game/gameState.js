// the per-room game state, and the helper that hands out ids for it

// grabs the next number and sticks a prefix on it, like "pu-7"
function newId(gs, prefix) {
  return `${prefix}-${gs.nextId++}`;
}

// builds the empty state once, when a match starts
function initGameState(room) {
  const gs = {
    bombs: [],        // { id, ownerId, x, y, range, timer }
    explosions: [],   // { id, x, y, remaining }
    powerUps: [],     // { id, x, y, type }
    nextId: 1,        // every new entity takes the next number
    finished: false,  // flips to true once the match is decided
    winnerId: null,   // null means nobody won, everyone died
    tickTimer: null,  // the interval handle, so the tick can be stopped
  };
  room.gameState = gs; // hangs on the room so every module can reach it
  return gs;
}

module.exports = {
  newId,
  initGameState,
};

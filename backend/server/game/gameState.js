// Per-room authoritative game state, plus its id and random helpers.

// seeded random for deterministic power-up drops within a room
function makeRandom(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

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
    random: makeRandom(room.id + Date.now()),
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

// owns the room's interval; the tick body is passed in to avoid a require cycle

const { TICK_MS } = require('./config');

// start the interval once per room, onTick runs every tick
function startTicking(room, onTick) {
  const gs = room.gameState;
  if (!gs || gs.tickTimer) return; // already ticking, or never initialised

  gs.tickTimer = setInterval(onTick, TICK_MS);
}

// safe on a room that never started ticking
function stopTicking(room) {
  const gs = room.gameState;
  if (!gs) return;

  clearInterval(gs.tickTimer);
  gs.tickTimer = null;
}

module.exports = {
  startTicking,
  stopTicking,
};

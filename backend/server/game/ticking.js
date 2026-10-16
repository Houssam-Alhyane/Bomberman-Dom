// Interval ownership for a room's authoritative tick.
//
// This module is only the timer: the tick body itself lives in gameLoop.js and
// is passed in, so finish.js can stop a match without requiring gameLoop.js
// back (which would be a require cycle).

const { TICK_MS } = require('./config');

//start the interval once per room, onTick runs every TICK_MS
function startTicking(room, onTick) {
  const gs = room.gameState;
  if (!gs || gs.tickTimer) return;

  gs.tickTimer = setInterval(onTick, TICK_MS);
}

//safe on a room that never started ticking (reset clears gameState first)
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

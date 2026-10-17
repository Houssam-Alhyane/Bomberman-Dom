

const ticking = require('./ticking');
const { advanceBombs, detonate } = require('./detonation');
const { advanceExplosions } = require('./explosions');
const { collectPowerUps } = require('./powerUps');
const { checkWinner } = require('./finish');

//one step: advance bombs, resolve blasts, age flames, collect, then check result
function tick(room, broadcast) {
  const gs = room.gameState;
  if (!gs || !room.map || gs.finished) return;

  const detonated = advanceBombs(gs);

  detonated.forEach((bomb) => detonate(room, bomb, broadcast));

  advanceExplosions(gs);
  collectPowerUps(room, broadcast);

  //only a blast can change who is still alive, so this is the only check needed
  if (detonated.length) {
    checkWinner(room, broadcast);
  }
}

//the room's interval is driven by this module's tick
function startTicking(room, broadcast) {
  ticking.startTicking(room, () => tick(room, broadcast));
}

module.exports = {
  startTicking,
  stopTicking: ticking.stopTicking,
};

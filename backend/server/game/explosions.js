// Explosion visuals only.
//
// Each blast tile keeps its own countdown and disappears when it runs out, so
// the client can draw the flame for EXPLOSION_DURATION. Who is hurt by the
// blast is decided in detonation.js, not here.

const { TICK_MS } = require('./config');

//age every live explosion by one tick and drop the finished ones
function advanceExplosions(gs) {
  gs.explosions.forEach((explosion) => {
    explosion.remaining -= TICK_MS;
  });

  gs.explosions = gs.explosions.filter((explosion) => explosion.remaining > 0);
}

module.exports = {
  advanceExplosions,
};

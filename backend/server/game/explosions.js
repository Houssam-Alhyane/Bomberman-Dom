// flames are visuals only, who gets hurt is decided in detonation.js

const { TICK_MS } = require('./config');

// age every live explosion by one tick and drop the finished ones
function advanceExplosions(gs) {
  gs.explosions.forEach((explosion) => {
    explosion.remaining -= TICK_MS;
  });

  gs.explosions = gs.explosions.filter((explosion) => explosion.remaining > 0);
}

module.exports = {
  advanceExplosions,
};

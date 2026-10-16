// Power-up collection: a living player standing on an item picks it up, the
// stat grows, and the room is told about the new values.

const { isCovered } = require('./grid');
const { applyPowerUp, playerStats } = require('./playerStats');

//hand every unclaimed item to the first living player standing on it
function collectPowerUps(room, broadcast) {
  const gs = room.gameState;

  gs.powerUps.slice().forEach((powerUp) => {
    for (const player of room.players) {
      if (!player.alive) continue;
      if (!isCovered(player, [{ x: powerUp.x, y: powerUp.y }])) continue;

      applyPowerUp(player, powerUp.type);
      gs.powerUps = gs.powerUps.filter((p) => p !== powerUp);

      broadcast(room, {
        type: 'powerup_collected',
        playerId: player.id,
        x: powerUp.x,
        y: powerUp.y,
        powerUpType: powerUp.type,
        // send updated stats so client stays in sync
        stats: playerStats(player),
      });

      break; // one player per item
    }
  });
}

module.exports = {
  collectPowerUps,
};

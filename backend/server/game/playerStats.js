// Player stats: defaults, power-up growth, and the serialisable snapshot.

const { DEFAULT_STATS, MAX_SPEED, MAX_BOMBS, MAX_RANGE } = require('./config');

function initPlayerStats(player) {
  Object.assign(player, { ...DEFAULT_STATS });
  // clear leftover bomb tracking from prior matches
  player.liveBombs = [];
}

function applyPowerUp(player, type) {
  if (type === 'bomb') player.bombs = Math.min(player.bombs + 1, MAX_BOMBS);
  if (type === 'flame') player.flameRange = Math.min(player.flameRange + 1, MAX_RANGE);
  if (type === 'speed') player.speed = Math.min(player.speed + 1, MAX_SPEED);
}

function playerStats(player) {
  return {
    lives: player.lives,
    alive: player.alive,
    speed: player.speed,
    bombs: player.bombs,
    flameRange: player.flameRange,
  };
}

module.exports = {
  initPlayerStats,
  applyPowerUp,
  playerStats,
};

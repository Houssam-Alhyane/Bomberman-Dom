// player stats: the defaults, how power-ups grow them, and the copy we send out

const { DEFAULT_STATS, MAX_SPEED, MAX_BOMBS, MAX_RANGE } = require('./config');

// hand a player fresh stats, called once when the match starts
function initPlayerStats(player) {
  Object.assign(player, { ...DEFAULT_STATS });
  player.liveBombs = []; // its own array, never shared between players
}

// grow one stat by one, but never past its ceiling
function applyPowerUp(player, type) {
  if (type === 'bomb') player.bombs = Math.min(player.bombs + 1, MAX_BOMBS);
  if (type === 'flame') player.flameRange = Math.min(player.flameRange + 1, MAX_RANGE);
  if (type === 'speed') player.speed = Math.min(player.speed + 1, MAX_SPEED);
}

// the plain numbers we can safely send over the socket
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

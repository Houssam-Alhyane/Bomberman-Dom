// all the tunable game rules and limits, shared by the game modules

const TICK_RATE = 60;             // ticks per second
const TICK_MS = 1000 / TICK_RATE; // one tick in ms, about 16.67
const BOMB_TIMER = 3000;          // ms until a bomb detonates
const EXPLOSION_DURATION = 500;   // ms a flame stays on the board
const DROP_CHANCE = 0.3;          // 30% chance a broken block drops a power-up
const POWERUP_TYPES = ['bomb', 'flame', 'speed'];

// the stats every player starts a match with
const DEFAULT_STATS = { lives: 3, alive: true, speed: 1, bombs: 1, flameRange: 1 };
// ceilings that power-ups can never push a stat past
const MAX_SPEED = 5;
const MAX_BOMBS = 8;
const MAX_RANGE = 10;

module.exports = {
  TICK_RATE,
  TICK_MS,
  BOMB_TIMER,
  EXPLOSION_DURATION,
  DROP_CHANCE,
  POWERUP_TYPES,
  DEFAULT_STATS,
  MAX_SPEED,
  MAX_BOMBS,
  MAX_RANGE,
};

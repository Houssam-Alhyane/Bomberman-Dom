// Tunable game rules and limits, shared by the game modules.

const TICK_RATE = 60;             // ticks per second
const TICK_MS = 1000 / TICK_RATE; // ~16.67ms
const BOMB_TIMER = 3000;          // ms until detonation
const EXPLOSION_DURATION = 500;   // ms an explosion tile stays
const DROP_CHANCE = 0.3;          // chance a broken block drops a power-up
const POWERUP_TYPES = ['bomb', 'flame', 'speed'];

// default stats for a new match
const DEFAULT_STATS = { lives: 3, alive: true, speed: 1, bombs: 1, flameRange: 1 };
// hard maximums that powerups cannot exceed
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

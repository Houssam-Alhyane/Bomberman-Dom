// Resolving a bomb blast: which tiles it covers, what it destroys, and who it
// hurts. Called once per detonated bomb by the room's tick.
//
// The room's gameState stays the single source of truth for live bombs,
// explosions and power-ups; this module only applies a blast to it.

const {
  TICK_MS,
  EXPLOSION_DURATION,
  DROP_CHANCE,
  POWERUP_TYPES,
} = require('./config');
const { explosionCover, isCovered } = require('./grid');
const { newId } = require('./gameState');

//tick every live bomb down and hand back the ones that reached zero
function advanceBombs(gs) {
  const detonated = [];

  gs.bombs.forEach((bomb) => {
    bomb.timer -= TICK_MS;
    if (bomb.timer <= 0) detonated.push(bomb);
  });

  if (detonated.length) {
    gs.bombs = gs.bombs.filter((bomb) => bomb.timer > 0);
  }

  return detonated;
}

//remember one flame tile so the client can draw it for a moment
function addExplosion(gs, tile) {
  gs.explosions.push({
    id: newId(gs, 'exp'),
    x: tile.x,
    y: tile.y,
    remaining: EXPLOSION_DURATION,
  });
}

//a broken block sometimes leaves a random power-up behind
function dropPowerUp(room, gs, tile, broadcast) {
  if (Math.random() >= DROP_CHANCE) return;

  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

  gs.powerUps.push({
    id: newId(gs, 'pu'),
    x: tile.x,
    y: tile.y,
    type,
  });

  broadcast(room, {
    type: 'powerup_spawn',
    x: tile.x,
    y: tile.y,
    powerUpType: type,
  });
}

//clear a block from the map, tell the room, then roll for a power-up
function destroyBlock(room, gs, tile, broadcast) {
  room.map.removeBlock(tile.x, tile.y);
  broadcast(room, { type: 'block_destroyed', x: tile.x, y: tile.y });

  dropPowerUp(room, gs, tile, broadcast);
}

//one life per blast; zero lives means dead, already dead players are skipped
function damagePlayers(room, covered, broadcast) {
  room.players.forEach((player) => {
    if (!player.alive) return;
    if (!isCovered(player, covered)) return;

    player.lives -= 1;
    if (player.lives <= 0) {
      player.lives = 0;
      player.alive = false;
    }

    broadcast(room, {
      type: 'player_hit',
      playerId: player.id,
      lives: player.lives,
      alive: player.alive,
    });
  });
}

//apply one detonated bomb: cover its tiles, break what is breakable, then damage
function detonate(room, bomb, broadcast) {
  const gs = room.gameState;
  const map = room.map;

  const covered = explosionCover(bomb.x, bomb.y, bomb.range, map);

  covered.forEach((tile) => {
    addExplosion(gs, tile);

    if (map.isBlock(tile.x, tile.y)) {
      destroyBlock(room, gs, tile, broadcast);
    }
  });

  broadcast(room, {
    type: 'explosion',
    tiles: covered.map((tile) => ({ x: tile.x, y: tile.y })),
  });

  damagePlayers(room, covered, broadcast);
}

module.exports = {
  advanceBombs,
  detonate,
};

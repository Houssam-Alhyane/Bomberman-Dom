// Server-side game tick: bombs, explosions, damage, power-ups, game over.
// Runs at a fixed interval while a room is in 'playing' state.
//
// This module only orchestrates a single tick; the rules and helpers live in:
//   config.js       - timings, drop chance, power-up kinds, stat limits
//   grid.js         - player/tile mapping and blast coverage
//   playerStats.js  - per-player stats and power-up growth
//   gameState.js    - per-room state plus id/random helpers

const {
  TICK_MS,
  EXPLOSION_DURATION,
  DROP_CHANCE,
  POWERUP_TYPES,
} = require('./config');
const { isCovered, explosionCover } = require('./grid');
const { applyPowerUp, playerStats } = require('./playerStats');
const { newId } = require('./gameState');

function startTicking(room, broadcast) {
  const gs = room.gameState;
  if (gs.tickTimer) return;

  gs.tickTimer = setInterval(() => tick(room, broadcast), TICK_MS);
}

function stopTicking(room) {
  const gs = room.gameState;
  if (!gs) return;
  clearInterval(gs.tickTimer);
  gs.tickTimer = null;
}

// End the match immediately and tell the room who won.
// Used when the game can no longer continue, e.g. a player left and only one
// competitor is left standing.
function finishGame(room, broadcast) {
  const gs = room.gameState;
  if (!gs || gs.finished) return;

  const remaining = room.players;
  gs.finished = true;
  gs.winnerId = remaining.length === 1 ? remaining[0].id : null;

  broadcast(room, { type: 'game_over', winnerId: gs.winnerId });
  stopTicking(room);
}

function tick(room, broadcast) {
  const gs = room.gameState;
  const map = room.map;
  if (!gs || !map || gs.finished) return;

  // --- advance bomb timers --------------------------------------------------
  const detonated = [];
  gs.bombs.forEach((bomb) => {
    bomb.timer -= TICK_MS;
    if (bomb.timer <= 0) detonated.push(bomb);
  });
  if (detonated.length) {
    gs.bombs = gs.bombs.filter((b) => b.timer > 0);
  }

  // --- process detonations --------------------------------------------------
  detonated.forEach((bomb) => {
    const covered = explosionCover(bomb.x, bomb.y, bomb.range, map);

    // add explosion visuals
    covered.forEach((tile) => {
      gs.explosions.push({
        id: newId(gs, 'exp'),
        x: tile.x,
        y: tile.y,
        remaining: EXPLOSION_DURATION,
      });

      // destroy blocks
      if (map.isBlock(tile.x, tile.y)) {
        map.removeBlock(tile.x, tile.y);
        broadcast(room, { type: 'block_destroyed', x: tile.x, y: tile.y });

        // maybe drop a power-up
        if (Math.random() < DROP_CHANCE) {
          const puType =
            POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
          const pu = {
            id: newId(gs, 'pu'),
            x: tile.x,
            y: tile.y,
            type: puType,
          };
          gs.powerUps.push(pu);
          broadcast(room, {
            type: 'powerup_spawn',
            x: tile.x,
            y: tile.y,
            powerUpType: puType,
          });
        }
      }
    });

    // send explosion event to clients
    broadcast(room, {
      type: 'explosion',
      tiles: covered.map((t) => ({ x: t.x, y: t.y })),
    });

    // --- damage: each living player on a covered tile loses one life --------
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
  });

  // --- advance explosion visuals --------------------------------------------
  gs.explosions.forEach((e) => {
    e.remaining -= TICK_MS;
  });
  gs.explosions = gs.explosions.filter((e) => e.remaining > 0);

  // --- power-up collection --------------------------------------------------
  gs.powerUps.slice().forEach((pu) => {
    for (const player of room.players) {
      if (!player.alive) continue;
      if (!isCovered(player, [{ x: pu.x, y: pu.y }])) continue;

      // apply the stat
      applyPowerUp(player, pu.type);
      gs.powerUps = gs.powerUps.filter((p) => p !== pu);
      broadcast(room, {
        type: 'powerup_collected',
        playerId: player.id,
        x: pu.x,
        y: pu.y,
        powerUpType: pu.type,
        // send updated stats so client stays in sync
        stats: playerStats(player),
      });
      break; // one player per item
    }
  });

  // --- check winner after detonation damage ---------------------------------
  if (detonated.length && !gs.finished) {
    const alive = room.players.filter((p) => p.alive);
    if (alive.length <= 1) {
      gs.finished = true;
      gs.winnerId = alive.length === 1 ? alive[0].id : null;
      broadcast(room, { type: 'game_over', winnerId: gs.winnerId });
      stopTicking(room);
    }
  }
}

module.exports = {
  startTicking,
  stopTicking,
  finishGame,
};

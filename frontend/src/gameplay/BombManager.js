import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';
import { Bomb } from './Bomb.js';
import { Explosion } from './Explosion.js';
import { PowerUp, POWERUP_TYPES } from './PowerUp.js';

// fixed visual rule: how long an explosion tile displays on the client
const EXPLOSION_DURATION = 500;

// a blast range never exceeds this (matches server).
export const MAX_RANGE = 10;

// The BombManager is now a *display-only* layer.
// All gameplay decisions (detonation, damage, powerups, game over) come from
// the server. The client only:
//   1. Requests bomb placement (server decides if it's valid)
//   2. Displays bombs, explosions, powerups from server events
//   3. Ticks visual timers for animations
export class BombManager {
  constructor() {
    this.nextId = 1;
    this.eventHandler = null;
    this.announced = false;
  }

  // register the outgoing fact handler, wired to the socket elsewhere.
  onEvent(callback) {
    this.eventHandler = callback;
  }

  // Request a bomb placement. The server will validate and broadcast if accepted.
  placeBomb(player, state) {
    if (!player?.alive || !state) return;

    const tile = this.tileOf(player);

    // local duplicate check (avoids sending obviously bad requests)
    const taken = state.bombs.some((bomb) => bomb.x === tile.x && bomb.y === tile.y);
    if (taken) return;

    // just send the request — no range, no capacity check, server decides
    this.emit({ type: 'place_bomb' });
  }

  // Advance visual timers only — no detonation, no damage, no powerups.
  update(frameTime, state, map) {
    if (!state || !map) return;

    // tick bomb visual timers (for animation/pulsing)
    state.bombs.forEach((bomb) => bomb.tick(frameTime));
    // remove bombs whose timers expired locally (server will send explosion event)
    state.bombs = state.bombs.filter((bomb) => !bomb.expired);

    // tick explosion visual timers
    state.explosions.forEach((explosion) => explosion.tick(frameTime));
    state.explosions = state.explosions.filter((explosion) => !explosion.expired);
  }

  // Apply an authoritative server event to the local display state.
  applyRemote(event, state) {
    if (!event || !state) return;

    // Server confirmed a bomb placement
    if (event.type === 'place_bomb') {
      const range = Math.max(1, Math.min(MAX_RANGE, event.range || 1));
      // avoid duplicate if we already added it from a prior message
      const exists = state.bombs.some((b) => b.x === event.x && b.y === event.y);
      if (!exists) {
        state.bombs.push(
          new Bomb(this.newId('bomb'), event.playerId, event.x, event.y, range, 3000),
        );
      }
      return;
    }

    // Server says an explosion happened — add visual explosion tiles
    if (event.type === 'explosion') {
      (event.tiles || []).forEach((tile) => {
        state.explosions.push(
          new Explosion(this.newId('exp'), tile.x, tile.y, EXPLOSION_DURATION),
        );
      });
      // remove any bombs at the explosion origin (the server detonated them)
      if (event.tiles && event.tiles.length > 0) {
        const origin = event.tiles[0];
        state.bombs = state.bombs.filter(
          (b) => !(b.x === origin.x && b.y === origin.y),
        );
      }
      return;
    }

    // Server destroyed a block — update the local map copy
    if (event.type === 'block_destroyed') {
      if (state.map) {
        state.map.tiles = state.map.tiles.filter(
          (t) => !(t.type === 'block' && t.x === event.x && t.y === event.y),
        );
      }
      return;
    }

    // Server spawned a power-up
    if (event.type === 'powerup_spawn') {
      if (!POWERUP_TYPES.includes(event.powerUpType)) return;
      if (!Number.isInteger(event.x) || !Number.isInteger(event.y)) return;
      state.powerUps.push(
        new PowerUp(this.newId('power'), event.x, event.y, event.powerUpType),
      );
      return;
    }

    // Server confirmed a power-up was collected
    if (event.type === 'powerup_collected') {
      state.powerUps = state.powerUps.filter(
        (item) => !(item.x === event.x && item.y === event.y),
      );
      // update local player stats from server
      if (event.stats) {
        const player = state.players.get(event.playerId);
        if (player) {
          player.setStats(event.stats);
        }
      }
      return;
    }

    // Server says a player got hit
    if (event.type === 'player_hit') {
      const player = state.players.get(event.playerId);
      if (player) {
        player.setServerState(event.lives, event.alive);
      }
      return;
    }

    // Server declares game over
    if (event.type === 'game_over') {
      const winnerId = event.winnerId ?? null;
      if (winnerId !== null && !state.players.has(winnerId)) return;

      state.winner = winnerId;
      this.announced = true;
    }
  }

  // hand an outgoing fact to the network layer.
  emit(fact) {
    this.eventHandler?.(fact);
  }

  // unique id for a new entity.
  newId(prefix) {
    return `${prefix}-${this.nextId++}`;
  }

  // the single tile a player centers on.
  tileOf(player) {
    return {
      x: Math.floor((player.x + PLAYER_SIZE / 2) / TILE_SIZE),
      y: Math.floor((player.y + PLAYER_SIZE / 2) / TILE_SIZE),
    };
  }
}

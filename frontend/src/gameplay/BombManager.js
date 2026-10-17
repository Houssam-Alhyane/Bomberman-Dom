import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';
import { Bomb } from './Bomb.js';
import { Explosion } from './Explosion.js';
import { PowerUp, POWERUP_TYPES } from './PowerUp.js';

// flames are drawn for this long, matches EXPLOSION_DURATION on the server
const EXPLOSION_DURATION = 500;

// a blast range never exceeds this, matches the server's MAX_RANGE
export const MAX_RANGE = 10;

// display only, the client asks for bombs and draws whatever the server sends
export class BombManager {
  constructor() {
    this.nextId = 1;
    this.eventHandler = null;
    this.announced = false;
  }

  // remember how to send a fact out to the socket
  onEvent(callback) {
    this.eventHandler = callback;
  }

  // ask for a bomb, the server validates it and broadcasts if it is allowed
  placeBomb(player, state) {
    if (!player?.alive || !state) return;

    const tile = this.tileOf(player);

    // local check only, so we don't send an obviously silly request
    const taken = state.bombs.some((bomb) => bomb.x === tile.x && bomb.y === tile.y);
    if (taken) return;

    // no range and no capacity, the server decides both
    this.emit({ type: 'place_bomb' });
  }

  // advance the visual timers only, no detonation and no damage here
  update(frameTime, state, map) {
    if (!state || !map) return;

    // bombs tick down on their own timers
    state.bombs.forEach((bomb) => bomb.tick(frameTime));
    // drop the ones that ran out, the server sends the real explosion
    state.bombs = state.bombs.filter((bomb) => !bomb.expired);

    // flames fade on their own timers too
    state.explosions.forEach((explosion) => explosion.tick(frameTime));
    state.explosions = state.explosions.filter((explosion) => !explosion.expired);
  }

  // turn one server message into local display state
  applyRemote(event, state) {
    if (!event || !state) return;

    // the server accepted a bomb
    if (event.type === 'place_bomb') {
      const range = Math.max(1, Math.min(MAX_RANGE, event.range || 1));
      // skip it if we already added one from an earlier message
      const exists = state.bombs.some((b) => b.x === event.x && b.y === event.y);
      if (!exists) {
        state.bombs.push(
          new Bomb(this.newId('bomb'), event.playerId, event.x, event.y, range, 3000),
        );
      }
      return;
    }

    // an explosion happened, add one flame per tile
    if (event.type === 'explosion') {
      (event.tiles || []).forEach((tile) => {
        state.explosions.push(
          new Explosion(this.newId('exp'), tile.x, tile.y, EXPLOSION_DURATION),
        );
      });
      // drop the bomb that was sitting at the origin
      if (event.tiles && event.tiles.length > 0) {
        const origin = event.tiles[0];
        state.bombs = state.bombs.filter(
          (b) => !(b.x === origin.x && b.y === origin.y),
        );
      }
      return;
    }

    // a block went away, remove it from our copy of the map
    if (event.type === 'block_destroyed') {
      if (state.map) {
        state.map = state.map.filter(
          (t) => !(t.type === 'block' && t.x === event.x && t.y === event.y),
        );
      }
      return;
    }

    // a power-up appeared
    if (event.type === 'powerup_spawn') {
      if (!POWERUP_TYPES.includes(event.powerUpType)) return;
      if (!Number.isInteger(event.x) || !Number.isInteger(event.y)) return;
      state.powerUps.push(
        new PowerUp(this.newId('power'), event.x, event.y, event.powerUpType),
      );
      return;
    }

    // a power-up was picked up
    if (event.type === 'powerup_collected') {
      state.powerUps = state.powerUps.filter(
        (item) => !(item.x === event.x && item.y === event.y),
      );
      // copy the server's new stats onto that player
      if (event.stats) {
        const player = state.players.get(event.playerId);
        if (player) {
          player.setStats(event.stats);
        }
      }
      return;
    }

    // a player took a hit
    if (event.type === 'player_hit') {
      const player = state.players.get(event.playerId);
      if (player) {
        player.setServerState(event.lives, event.alive);
      }
      return;
    }

    // the match is decided
    if (event.type === 'game_over') {
      const winnerId = event.winnerId ?? null;
      if (winnerId !== null && !state.players.has(winnerId)) return;

      state.winner = winnerId;
      this.announced = true;
    }
  }

  // hand an outgoing fact to the network layer
  emit(fact) {
    this.eventHandler?.(fact);
  }

  // unique id for a new local entity
  newId(prefix) {
    return `${prefix}-${this.nextId++}`;
  }

  // the one tile under the middle of the player
  tileOf(player) {
    return {
      x: Math.floor((player.x + PLAYER_SIZE / 2) / TILE_SIZE),
      y: Math.floor((player.y + PLAYER_SIZE / 2) / TILE_SIZE),
    };
  }
}

import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';
import { Bomb } from './Bomb.js';

// fixed rule values agreed for the team.
const BOMB_TIMER = 3000;

// the single front door for bombs, explosions, damage, power-ups and winner.
export class BombManager {
  constructor() {
    this.nextId = 1;
    this.eventHandler = null;
  }

  // register the outgoing fact handler, wired to the socket elsewhere.
  onEvent(callback) {
    this.eventHandler = callback;
  }

  // place a bomb on the player's tile when the rules allow it.
  placeBomb(player, state) {
    if (!player?.alive || !state) return;

    const tile = this.tileOf(player);
    const taken = state.bombs.some((bomb) => bomb.x === tile.x && bomb.y === tile.y);
    if (taken) return;
    if (this.liveBombs(state, player.id) >= player.bombs) return;

    const bomb = new Bomb(this.newId('bomb'), player.id, tile.x, tile.y, player.flameRange, BOMB_TIMER);
    state.bombs.push(bomb);
    this.emit({ type: 'place_bomb', playerId: player.id, x: tile.x, y: tile.y, range: player.flameRange });
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

  // count a player's live bombs.
  liveBombs(state, ownerId) {
    return state.bombs.filter((bomb) => bomb.ownerId === ownerId).length;
  }
}

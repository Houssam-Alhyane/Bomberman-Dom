import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';
import { Bomb } from './Bomb.js';
import { Explosion } from './Explosion.js';
import { DamageSystem } from './DamageSystem.js';

// fixed rule values agreed for the team.
const BOMB_TIMER = 3000;
const EXPLOSION_DURATION = 500;

// the single front door for bombs, explosions, damage, power-ups and winner.
export class BombManager {
  constructor() {
    this.nextId = 1;
    this.eventHandler = null;
    this.damage = new DamageSystem();
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

  // advance bombs, explosions, drops, hits and the winner by one fixed step.
  update(frameTime, state, map) {
    if (!state || !map) return;

    const detonated = [];
    state.bombs.forEach((bomb) => {
      bomb.tick(frameTime);
      if (bomb.expired) detonated.push(bomb);
    });
    if (detonated.length) {
      state.bombs = state.bombs.filter((bomb) => !bomb.expired);
    }

    detonated.forEach((bomb) => this.detonate(state, map, bomb));

    state.explosions.forEach((explosion) => explosion.tick(frameTime));
    state.explosions = state.explosions.filter((explosion) => !explosion.expired);
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

  // explode one bomb: cover tiles, break blocks, drop items and hurt players.
  detonate(state, map, bomb) {
    const covered = Explosion.cover(bomb.x, bomb.y, bomb.range, map);

    covered.forEach((tile) => {
      state.explosions.push(new Explosion(this.newId('exp'), tile.x, tile.y, EXPLOSION_DURATION));
      if (map.isBlock(tile.x, tile.y)) this.destroyBlock(state, map, tile);
    });

    // one explosion is a single event, so each covered player loses one life
    this.damage.apply(state.players.values(), covered);
  }

  // remove a broken block and maybe leave a power-up behind.
  destroyBlock(state, map, tile) {
    map.tiles = map.tiles.filter(
      (entry) => !(entry.type === 'block' && entry.x === tile.x && entry.y === tile.y)
    );
  }
}

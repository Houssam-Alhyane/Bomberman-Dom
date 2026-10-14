import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';
import { Bomb } from './Bomb.js';
import { Explosion } from './Explosion.js';
import { DamageSystem, isCovered } from './DamageSystem.js';
import { PowerUp, randomType, shouldDrop } from './PowerUp.js';

// fixed rule values agreed for the team.
const BOMB_TIMER = 3000;
const EXPLOSION_DURATION = 500;
const DROP_CHANCE = 0.3;

// the single front door for bombs, explosions, damage, power-ups and winner.
export class BombManager {
  constructor() {
    this.nextId = 1;
    this.eventHandler = null;
    this.damage = new DamageSystem();
    this.announced = false;
    this.random = Math.random;
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

    this.collect(state);

    // decide the match once, after every death from this step is applied
    if (detonated.length) this.checkWinner(state);
  }

  // mirror a fact that arrived from the relay.
  applyRemote(event, state) {
    if (!event || !state) return;

    if (event.type === 'place_bomb') {
      const taken = state.bombs.some((bomb) => bomb.x === event.x && bomb.y === event.y);
      if (!taken) {
        state.bombs.push(new Bomb(this.newId('bomb'), event.playerId, event.x, event.y, event.range, BOMB_TIMER));
      }
      return;
    }

    if (event.type === 'powerup_spawn') {
      state.powerUps.push(new PowerUp(this.newId('power'), event.x, event.y, event.powerUpType));
      return;
    }

    if (event.type === 'powerup_collect') {
      state.powerUps = state.powerUps.filter((item) => !(item.x === event.x && item.y === event.y));
      return;
    }

    if (event.type === 'game_over') {
      state.winner = event.winnerId;
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

    if (!shouldDrop(DROP_CHANCE, this.random)) return;

    const type = randomType(this.random);
    state.powerUps.push(new PowerUp(this.newId('power'), tile.x, tile.y, type));
    this.emit({ type: 'powerup_spawn', x: tile.x, y: tile.y, powerUpType: type });
  }

  // a living player standing on a power-up takes it.
  collect(state) {
    state.powerUps.slice().forEach((item) => {
      const player = this.playerOn(state, item.x, item.y);
      if (!player) return;

      item.applyTo(player);
      state.powerUps = state.powerUps.filter((other) => other !== item);
      this.emit({ type: 'powerup_collect', playerId: player.id, x: item.x, y: item.y });
    });
  }

  // the first living player standing on a tile.
  playerOn(state, x, y) {
    for (const player of state.players.values()) {
      if (!player.alive) continue;
      if (isCovered(player, [{ x, y }])) return player;
    }
    return null;
  }

  // one survivor wins, none is a draw, and the result is announced once.
  checkWinner(state) {
    if (this.announced) return;

    const alive = [...state.players.values()].filter((player) => player.alive);
    if (alive.length > 1) return;

    state.winner = alive.length === 1 ? alive[0].id : null;
    this.announced = true;
    this.emit({ type: 'game_over', winnerId: state.winner });
  }
}

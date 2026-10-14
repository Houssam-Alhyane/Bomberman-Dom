import { TILE_SIZE, PLAYER_SIZE } from '../world/map/Map.js';

// every tile a player hitbox covers in pixels.
export function occupiedTiles(player) {
  const startCol = Math.floor(player.x / TILE_SIZE);
  const endCol = Math.ceil((player.x + PLAYER_SIZE) / TILE_SIZE) - 1;
  const startRow = Math.floor(player.y / TILE_SIZE);
  const endRow = Math.ceil((player.y + PLAYER_SIZE) / TILE_SIZE) - 1;

  const tiles = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      tiles.push({ x: col, y: row });
    }
  }

  return tiles;
}

// true when a player stands on any tile the blast covers.
export function isCovered(player, covered) {
  return occupiedTiles(player).some((tile) =>
    covered.some((hit) => hit.x === tile.x && hit.y === tile.y)
  );
}

// applies explosion damage to players, one life per blast.
export class DamageSystem {
  constructor() {
    this.hits = [];
  }

  // hit each living player a single blast covers, once.
  apply(players, covered) {
    [...players].forEach((player) => {
      if (!player.alive) return;
      if (!isCovered(player, covered)) return;

      player.lives -= 1;
      if (player.lives <= 0) {
        player.lives = 0;
        player.alive = false;
      }

      this.hits.push(player.id);
    });
  }
}

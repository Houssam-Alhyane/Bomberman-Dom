// Spatial helpers: mapping players onto grid tiles and computing blast coverage.

const { TILE_SIZE, PLAYER_SIZE } = require('./map');

// the single tile a player centers on
function tileOf(player) {
  return {
    x: Math.floor((player.x + PLAYER_SIZE / 2) / TILE_SIZE),
    y: Math.floor((player.y + PLAYER_SIZE / 2) / TILE_SIZE),
  };
}

// tiles a player hitbox overlaps
function occupiedTiles(player) {
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

function isCovered(player, covered) {
  return occupiedTiles(player).some((t) =>
    covered.some((h) => h.x === t.x && h.y === t.y),
  );
}

// explosion coverage from an origin in four directions.

function explosionCover(x, y, range, map) {
  const tiles = [{ x, y }];
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];
  dirs.forEach(({ dx, dy }) => {
    for (let step = 1; step <= range; step++) {
      const tx = x + dx * step;
      const ty = y + dy * step;
      if (!map.isInsideMap(tx, ty) || map.isWall(tx, ty)) break;
      tiles.push({ x: tx, y: ty });
      if (map.isBlock(tx, ty)) break;
    }
  });
  return tiles;
}

module.exports = {
  tileOf,
  occupiedTiles,
  isCovered,
  explosionCover,
};

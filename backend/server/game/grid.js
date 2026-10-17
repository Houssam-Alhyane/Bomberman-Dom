// spatial helpers: where a player sits on the grid, and what a blast covers

const { TILE_SIZE, PLAYER_SIZE } = require('./map');

// the one tile under the middle of the player, used for placing bombs
function tileOf(player) {
  return {
    x: Math.floor((player.x + PLAYER_SIZE / 2) / TILE_SIZE),
    y: Math.floor((player.y + PLAYER_SIZE / 2) / TILE_SIZE),
  };
}

// every tile the player's body touches, used for taking damage
function occupiedTiles(player) {
  const startCol = Math.floor(player.x / TILE_SIZE);
  // the -1 matters: x + PLAYER_SIZE is the first pixel outside the body
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

// true when the player's body overlaps any tile in the fire list
function isCovered(player, covered) {
  return occupiedTiles(player).some((t) =>
    covered.some((h) => h.x === t.x && h.y === t.y),
  );
}

// the bomb tile plus everything the flame reaches in the four directions
function explosionCover(x, y, range, map) {
  const tiles = [{ x, y }]; // the bomb's own tile always burns
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
      // off the map or a wall stops the arm, and that tile does not burn
      if (!map.isInsideMap(tx, ty) || map.isWall(tx, ty)) break;
      tiles.push({ x: tx, y: ty });
      // a block burns, then stops the arm so the flame cannot pass through
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

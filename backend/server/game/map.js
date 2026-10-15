// The server owns the map: it generates the layout, sends it to every client,
// and uses it to validate player moves.
const TILE_SIZE = 50;
const PLAYER_SIZE = 25;

// Seeded random so a given seed always produces the same layout.
function makeRandom(seed) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
}

class GameMap {
  constructor(width, height, seed = 1) {
    this.width = width;
    this.height = height;
    this.random = makeRandom(seed);
    this.tiles = [];

    this.createWalls();
    this.generateBlocks();
  }

  isWall(x, y) {
    return (
      x === 0 ||
      y === 0 ||
      x === this.width - 1 ||
      y === this.height - 1 ||
      (x % 2 === 0 && y % 2 === 0)
    );
  }

  isInsideMap(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isBlock(x, y) {
    return this.tiles.some(
      (tile) => tile.type === 'block' && tile.x === x && tile.y === y,
    );
  }

  isSpawn(x, y) {
    return (
      (x <= 2 && y <= 2) ||
      (x >= this.width - 3 && y <= 2) ||
      (x <= 2 && y >= this.height - 3) ||
      (x >= this.width - 3 && y >= this.height - 3)
    );
  }

  createWalls() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.isWall(x, y)) this.tiles.push({ x, y, type: 'wall' });
      }
    }
  }

  generateBlocks() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.isWall(x, y) || this.isSpawn(x, y)) continue;
        if (this.random() < 0.5) this.tiles.push({ x, y, type: 'block' });
      }
    }
  }

  canMoveTo(x, y, width = PLAYER_SIZE, height = PLAYER_SIZE) {
    const left = x;
    const top = y;
    const right = x + width;
    const bottom = y + height;

    if (
      left < 0 ||
      top < 0 ||
      right > this.width * TILE_SIZE ||
      bottom > this.height * TILE_SIZE
    ) {
      return false;
    }

    const startCol = Math.floor(left / TILE_SIZE);
    const endCol = Math.ceil(right / TILE_SIZE) - 1;
    const startRow = Math.floor(top / TILE_SIZE);
    const endRow = Math.ceil(bottom / TILE_SIZE) - 1;

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (!this.isInsideMap(col, row)) return false;
        if (this.isWall(col, row)) return false;
        if (this.isBlock(col, row)) return false;
      }
    }

    return true;
  }
}

module.exports = { GameMap, TILE_SIZE, PLAYER_SIZE };

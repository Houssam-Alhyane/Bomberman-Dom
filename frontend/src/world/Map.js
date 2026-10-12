import { Tile } from './Tile.js';

export const TILE_SIZE = 40;
export const PLAYER_SIZE = 32;

export class Map {
    constructor(width = 15, height = 13) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.tiles = [];
        this.generate();
    }

    generate() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                let type = 'empty';

                if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                    type = 'wall';
                } else if (x % 2 === 0 && y % 2 === 0) {
                    type = 'wall';
                } else if (x % 2 === 0 || y % 2 === 0) {
                    type = 'block';
                }

                // keep the spawn area clear so the player can move
                if (x >= 1 && x <= 3 && y >= 1 && y <= 3) {
                    type = 'empty';
                }

                const tile = new Tile(x, y, type);
                this.grid[y][x] = tile;
                this.tiles.push(tile);
            }
        }
    }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return null;
        }
        return this.grid[y][x];
    }

    isSolidAt(px, py) {
        const tile = this.getTile(Math.floor(px / TILE_SIZE), Math.floor(py / TILE_SIZE));
        return !tile || tile.solid;
    }
}

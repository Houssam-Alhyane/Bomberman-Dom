class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];

        this.createWalls();
        // this.generateBlocks();
    }
    // create fixed walls
    createWalls() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const isBorder = x === 0 || y === 0
                    || x === this.width - 1 || y === this.height - 1
                const isInternalWall =
                    x % 2 === 0 &&
                    y % 2 === 0;

                if (isBorder || isInternalWall) {
                    this.tiles.push({
                        x,
                        y,
                        type: "wall"
                    });
                }
            }

        }

    }
    // create random blocks
    generateBlocks() {

    }
}

const walls = new Map(15 , 13)
console.log(walls.tiles)
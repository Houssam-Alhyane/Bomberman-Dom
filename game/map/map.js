
/*  # # # # # # # # # # # # # # #
    # . . . . . . . . . . . . . #
    # . # . # . # . # . # . # . #
    # . . . . . . . . . . . . . #
    # . # . # . # . # . # . # . #
    # . . . . . . . . . . . . . #
    # . # . # . # . # . # . # . #
    # . . . . . . . . . . . . . #
    # . # . # . # . # . # . # . #
    # . . . . . . . . . . . . . #
    # . # . # . # . # . # . # . #
    # . . . . . . . . . . . . . #
    # # # # # # # # # # # # # # #
 */

export class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
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

    // create fixed walls
    createWalls() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.isWall(x, y)) {
                    this.tiles.push({
                        x,
                        y,
                        type: "wall"
                    });
                }
            }
        }
    }

    isSpawn(x, y) {
        return (
            // top-left
            (x <= 2 && y <= 2) ||
            //  top-right : x > 15 - 3  = 12  && y <= 2 
            (x >= this.width - 3 && y <= 2) ||
            // bottom-left :  x <= 2 && y >=  13 - 3  = 10
            (x <= 2 && y >= this.height - 3) ||
            // bottom-right : x >= 15 - 3 = 12 && y >= 13 - 3 10 
            (x >= this.width - 3 && y >= this.height - 3)
        );
    }

    // create random blocks
    generateBlocks() {

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {

                if (this.isWall(x, y) || this.isSpawn(x, y)) {
                    continue
                }
                if (Math.random() < 0.5) {
                    this.tiles.push({
                        x,
                        y,
                        type: "block"
                    });
                }

            }
        }


    }

     canMoveTo(x, y) {
        // collision check here
    }

}


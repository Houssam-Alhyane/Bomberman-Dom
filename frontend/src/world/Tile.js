export class Tile {
    constructor(x, y, type = 'empty') {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    get solid() {
        return this.type === 'wall' || this.type === 'block';
    }
}

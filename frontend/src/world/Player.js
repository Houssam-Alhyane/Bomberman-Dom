import { PLAYER_SIZE } from './Map.js';

export class Player {
    constructor(id, name, x, y) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.alive = true;
        this.speed = 2;
    }

    movement(dx, dy, map) {
        const length = Math.hypot(dx, dy) || 1;
        const stepX = (dx / length) * this.speed;
        const stepY = (dy / length) * this.speed;

        if (!this.collides(this.x + stepX, this.y, map)) {
            this.x += stepX;
        }
        if (!this.collides(this.x, this.y + stepY, map)) {
            this.y += stepY;
        }
    }

    collides(x, y, map) {
        if (!map || typeof map.isSolidAt !== 'function') {
            return false;
        }

        const corners = [
            [x, y],
            [x + PLAYER_SIZE, y],
            [x, y + PLAYER_SIZE],
            [x + PLAYER_SIZE, y + PLAYER_SIZE]
        ];

        return corners.some(([px, py]) => map.isSolidAt(px, py));
    }
}

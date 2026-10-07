export class Player {
    constructor(id, nickname, x, y) {
        this.id = id
        this.nickname = nickname
        this.x = x
        this.y = y
        this.lives = 3
        this.alive = true
        this.speed = 1
    }

    movement(dx, dy, map) {
        const newX = this.x + dx * this.speed
        const newY = this.y + dy * this.speed
        
    }

}


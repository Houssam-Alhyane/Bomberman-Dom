import { Map } from "../map/Map.js"

export class Player {
    // stats are private so a console script cannot overwrite them
    #lives = 3
    #alive = true
    #speed = 1
    #bombs = 1
    #flameRange = 1

    constructor(id, nickname, x, y) {
        this.id = id
        this.nickname = nickname
        this.x = x
        this.y = y
    }

    // read-only views of the private stats
    get lives() { return this.#lives }
    get alive() { return this.#alive }
    get speed() { return this.#speed }
    get bombs() { return this.#bombs }
    get flameRange() { return this.#flameRange }

    // take one hit and lock elimination at zero lives
    loseLife() {
        if (!this.#alive) return

        this.#lives -= 1
        if (this.#lives <= 0) {
            this.#lives = 0
            this.#alive = false
        }
    }

    // raise a stat by one step when a power-up is collected
    addBomb() { this.#bombs += 1 }
    addFlame() { this.#flameRange += 1 }
    addSpeed() { this.#speed += 1 }

    // dx = 1 == -> && dx = -1 === <-
    // dy = 1 == ^ && dy = - 1  === |
    movement(dx, dy, map) {
        const newX = this.x + dx * this.speed
        const newY = this.y + dy * this.speed
        if (map.canMoveTo(newX, newY)) {
            this.x = newX;
            this.y = newY;
        }


    }

}

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

    // Apply authoritative lives/alive from the server.
    setServerState(lives, alive) {
        this.#lives = lives
        this.#alive = alive
    }

    // Apply authoritative stats from the server (after powerup collection).
    setStats(stats) {
        if (stats.lives !== undefined) this.#lives = stats.lives
        if (stats.alive !== undefined) this.#alive = stats.alive
        if (stats.speed !== undefined) this.#speed = stats.speed
        if (stats.bombs !== undefined) this.#bombs = stats.bombs
        if (stats.flameRange !== undefined) this.#flameRange = stats.flameRange
    }

    // dx = 1 == -> && dx = -1 === <-
    // dy = 1 == ^ && dy = - 1  === |
    // Propose the next position only. There is no collision here: the backend
    // owns the map and decides whether the move is legal.
    nextPosition(dx, dy) {
        return {
            x: this.x + dx * this.speed,
            y: this.y + dy * this.speed,
        }
    }

}

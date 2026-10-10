import { Player } from "./palyer.js";

// Manage PLayers of  the game
export class PlayerManager {
    constructor() {
        this.players = [];

        this.spawnPositions = [
            { x: 1, y: 1 },
            { x: 13, y: 1 },
            { x: 1, y: 11 },
            { x: 13, y: 11 }
        ];
    }

    addPlayer(id, nickname) {
        const playerIndex = this.players.length;

        if (playerIndex >= this.spawnPositions.length) {
            return null;
        }

        const spawn = this.spawnPositions[playerIndex];

        const player = new Player(
            id,
            nickname,
            spawn.x,
            spawn.y
        );

        this.players.push(player);

        return player;
    }

    removePlayer(id) {
        this.players = this.players.filter(
            player => player.id !== id
        );
    }

    getPlayer(id) {
        return this.players.find(
            player => player.id === id
        );
    }

    getPlayers() {
        return this.players;
    }
}

import { Player } from './Player.js';
import { TILE_SIZE } from '../map/Map.js';
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

        // Spawns are tiles; Player expects pixel coordinates.
        const player = new Player(
            id,
            nickname,
            spawn.x * TILE_SIZE,
            spawn.y * TILE_SIZE
        );

        this.players.push(player);

        return player;
    }
}

const { TILE_SIZE } = require('../map/Map');
const { Player } = require('../player/Player');

// Fallback grid size, kept in sync with the frontend's shared constants.
const DEFAULT_WIDTH = 15;
const DEFAULT_HEIGHT = 13;

// Manage Players of the game
class PlayerManager {
    constructor(map = null) {
        this.players = [];

        this.spawnPositions = this.buildSpawnPositions(map);
    }

    // Corner spawn tiles, kept inside the map's safe spawn zones so a player
    // never spawns on a wall or a block, whatever the map dimensions are.
    buildSpawnPositions(map) {
        const width = map ? map.width : DEFAULT_WIDTH;
        const height = map ? map.height : DEFAULT_HEIGHT;

        return [
            { x: 1, y: 1 },
            { x: width - 2, y: 1 },
            { x: 1, y: height - 2 },
            { x: width - 2, y: height - 2 }
        ];
    }

    addPlayer(id, nickname) {
        const existing = this.getPlayer(id);
        if (existing) {
            return existing;
        }

        // first free spawn, so a leaving player's spot can be reused without
        // ever putting two players on the same tile
        const spawn = this.spawnPositions.find(
            (position) =>
                !this.players.some(
                    (player) =>
                        player.x === position.x * TILE_SIZE &&
                        player.y === position.y * TILE_SIZE
                )
        );

        if (!spawn) {
            return null;
        }

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

    removePlayer(id) {
        this.players = this.players.filter(
            (player) => player.id !== id
        );
    }

    getPlayer(id) {
        return this.players.find(
            (player) => player.id === id
        );
    }

    getPlayers() {
        return this.players;
    }
}

module.exports = { PlayerManager };

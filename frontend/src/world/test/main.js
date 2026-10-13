import { Map, PLAYER_SIZE, TILE_SIZE } from "../map/Map.js";
import { handleInput } from "../player/playerinput.js";
import { PlayerManager } from "../player/PlayerManager.js";

const MAP_WIDTH = 15;
const MAP_HEIGHT = 13;
const board = document.querySelector("#game-board");

const map = new Map(MAP_WIDTH, MAP_HEIGHT);
const playerManager = new PlayerManager();
const player = playerManager.addPlayer("test-player", "Player 1");

board.style.setProperty("--map-width", MAP_WIDTH);
board.style.setProperty("--map-height", MAP_HEIGHT);
board.style.setProperty("--tile-size", `${TILE_SIZE}px`);
board.style.width = `${MAP_WIDTH * TILE_SIZE}px`;
board.style.height = `${MAP_HEIGHT * TILE_SIZE}px`;

function createTile(tile) {
    const element = document.createElement("div");
    element.className = `tile ${tile.type}`;
    element.style.left = `${tile.x * TILE_SIZE}px`;
    element.style.top = `${tile.y * TILE_SIZE}px`;
    board.append(element);
}

function renderMap() {
    map.tiles.forEach(createTile);
}

function createPlayer() {
    const element = document.createElement("div");
    element.className = "player";
    element.style.width = `${PLAYER_SIZE}px`;
    element.style.height = `${PLAYER_SIZE}px`;
    board.append(element);
    return element;
}

function updatePlayer(element) {
    element.style.transform = `translate(${player.x}px, ${player.y}px)`;
}

function gameLoop() {
    updatePlayer(playerElement);
    requestAnimationFrame(gameLoop);
}

renderMap();
const playerElement = createPlayer();
handleInput(player, map);
gameLoop();

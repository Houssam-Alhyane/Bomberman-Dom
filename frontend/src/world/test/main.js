import { Map, PLAYER_SIZE, TILE_SIZE } from "../map/Map.js";
import { Player } from "../player/Player.js";

const MAP_WIDTH = 15;
const MAP_HEIGHT = 13;
const board = document.querySelector("#game-board");

const map = new Map(MAP_WIDTH, MAP_HEIGHT);
const player = new Player("test-player", "Player 1", TILE_SIZE, TILE_SIZE);
const heldKeys = new Set();

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

function movePlayer() {
    if (heldKeys.has("ArrowUp")) player.movement(0, -1, map);
    if (heldKeys.has("ArrowDown")) player.movement(0, 1, map);
    if (heldKeys.has("ArrowLeft")) player.movement(-1, 0, map);
    if (heldKeys.has("ArrowRight")) player.movement(1, 0, map);
}

function gameLoop() {
    movePlayer();
    updatePlayer(playerElement);
    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault();
        heldKeys.add(event.key);
    }
});

document.addEventListener("keyup", (event) => {
    heldKeys.delete(event.key);
});

renderMap();
const playerElement = createPlayer();
gameLoop();

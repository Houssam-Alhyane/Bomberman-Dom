import { Map } from "../game/map/map.js";

const map = new Map(15, 13);

function render(map) {
    const container = document.querySelector("#game-map");

    container.innerHTML = "";

    for (const tile of map.tiles) {
        const element = document.createElement("div");

        element.classList.add("tile");
        element.classList.add(tile.type);

        element.style.gridColumn = tile.x + 1;
        element.style.gridRow = tile.y + 1;

        container.appendChild(element);
    }
}

render(map);
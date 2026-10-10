export function handleInput(player, map) {
    document.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "ArrowUp":
                player.movement(0, -1, map);
                break;

            case "ArrowDown":
                player.movement(0, 1, map);
                break;

            case "ArrowLeft":
                player.movement(-1, 0, map);
                break;

            case "ArrowRight":
                player.movement(1, 0, map);
                break;
        }
    });
}

export function handleInput(player, map) {
    document.addEventListener("keydown", (event) => {
        switch (event.key) {
            case "ArrowUp":
                event.preventDefault();
                player.movement(0, -1, map);
                break;

            case "ArrowDown":
                event.preventDefault();
                player.movement(0, 1, map);
                break;

            case "ArrowLeft":
                event.preventDefault();
                player.movement(-1, 0, map);
                break;

            case "ArrowRight":
                event.preventDefault();
                player.movement(1, 0, map);
                break;
        }
    });
}


export class Input {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
        };

        this.bomb = false;

        document.addEventListener("keydown", (event) => {
   
            switch (event.key) {
                case "ArrowUp":
                    this.keys.up = true;
                    event.preventDefault();
                    break;
                case "ArrowDown":
                    this.keys.down = true;
                    event.preventDefault();
                    break;
                case "ArrowLeft":
                    this.keys.left = true;
                    event.preventDefault();
                    break;
                case "ArrowRight":
                    this.keys.right = true;
                    event.preventDefault();
                    break;
                case " ":
                    event.preventDefault();
                    this.bomb = true;
                    break;
            }
        });

        document.addEventListener("keyup", (event) => {
            switch (event.key) {
                case "ArrowUp":
                    this.keys.up = false;
                    break;
                case "ArrowDown":
                    this.keys.down = false;
                    break;
                case "ArrowLeft":
                    this.keys.left = false;
                    break;
                case "ArrowRight":
                    this.keys.right = false;
                    break;
            }
        });

        window.addEventListener("blur", () => this.reset());
    }

    getDirection() {
        return {
            dx: Number(this.keys.right) - Number(this.keys.left),
            dy: Number(this.keys.down) - Number(this.keys.up),
        };
    }

    consumeBomb() {
        const bomb = this.bomb;
        this.bomb = false;
        return bomb;
    }

    reset() {
        this.keys.up = false;
        this.keys.down = false;
        this.keys.left = false;
        this.keys.right = false;
        this.bomb = false;
    }
}

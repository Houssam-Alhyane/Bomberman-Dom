// Maps a movement key to a direction name.
const KEY_DIRECTIONS = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
};

// Tracks which movement keys are held and turns them into a direction.
// The game loop asks for a direction every tick, so movement stays smooth.
export class Input {
    constructor(target = document) {
        this.target = target;
        this.keys = { up: false, down: false, left: false, right: false };
        this.actions = { bomb: false, bombHeld: false };

        this.onKeyDown = (event) => this.setKey(event, true);
        this.onKeyUp = (event) => this.setKey(event, false);
        this.onBlur = () => this.reset();

        this.target.addEventListener('keydown', this.onKeyDown);
        this.target.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
    }

    setKey(event, pressed) {
        // Single characters are lowercased so W/A/S/D and w/a/s/d both work.
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

        // space is an action, fired once per press and not while held
        if (key === ' ') {
            event.preventDefault();
            if (pressed && !this.actions.bombHeld) {
                this.actions.bomb = true;
                this.actions.bombHeld = true;
            }
            if (!pressed) {
                this.actions.bombHeld = false;
            }
            return;
        }

        const direction = KEY_DIRECTIONS[key];

        if (!direction) return;

        // Stop arrow keys from scrolling the page.
        event.preventDefault();
        this.keys[direction] = pressed;
    }

    // Returns the current direction, e.g. { dx: 1, dy: 0 } for right.
    getDirection() {
        const dx = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
        const dy = (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0);

        return { dx, dy };
    }

    // True once for each fresh space press, then clears the flag.
    consumeBomb() {
        const pressed = this.actions.bomb;
        this.actions.bomb = false;
        return pressed;
    }

    // Forget held keys, e.g. when a match starts or the window loses focus.
    reset() {
        this.keys = { up: false, down: false, left: false, right: false };
        this.actions = { bomb: false, bombHeld: false };
    }

    destroy() {
        this.target.removeEventListener('keydown', this.onKeyDown);
        this.target.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
    }
}

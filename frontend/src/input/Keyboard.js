const DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

// Tracks held arrow keys and reports the current direction.
export class Keyboard {
  constructor(target = window) {
    this.pressed = new Set();

    target.addEventListener('keydown', (event) => {
      if (DIRECTIONS[event.key]) {
        this.pressed.add(event.key);
        event.preventDefault();
      }
    });

    target.addEventListener('keyup', (event) => {
      this.pressed.delete(event.key);
    });
  }

  getDirection() {
    let dx = 0;
    let dy = 0;

    for (const key of this.pressed) {
      dx += DIRECTIONS[key][0];
      dy += DIRECTIONS[key][1];
    }

    return { dx: Math.sign(dx), dy: Math.sign(dy) };
  }
}

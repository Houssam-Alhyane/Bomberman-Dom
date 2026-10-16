// one blast tile that fades after a short lifetime.
export class Explosion {
  constructor(id, x, y, duration) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.remaining = duration;
  }

  // count down by one fixed step.
  tick(frameTime) {
    this.remaining -= frameTime;
  }

  // true once the blast tile has faded.
  get expired() {
    return this.remaining <= 0;
  }
}

// a single bomb waiting to detonate.
export class Bomb {
  constructor(id, ownerId, x, y, range, timer) {
    this.id = id;
    this.ownerId = ownerId;
    this.x = x;
    this.y = y;
    this.range = range;
    this.timer = timer;
  }

  // count down by one fixed step.
  tick(frameTime) {
    this.timer -= frameTime;
  }

  // true once the countdown is over.
  get expired() {
    return this.timer <= 0;
  }
}

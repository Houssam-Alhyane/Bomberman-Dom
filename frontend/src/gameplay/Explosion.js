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

  // every tile covered from an origin, out to range in four directions.
  static cover(x, y, range, map) {
    const tiles = [{ x, y }];
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    directions.forEach(({ dx, dy }) => {
      for (let step = 1; step <= range; step++) {
        const tx = x + dx * step;
        const ty = y + dy * step;
        const inside = map.isInsideMap ? map.isInsideMap(tx, ty) : true;

        // a wall or the map edge stops the blast
        if (!inside || map.isWall(tx, ty)) break;

        // blocks do not stop the blast, they get consumed later
        tiles.push({ x: tx, y: ty });
      }
    });

    return tiles;
  }
}

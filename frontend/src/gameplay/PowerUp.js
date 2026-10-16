// the three collectable power-up kinds.
export const POWERUP_TYPES = ['bomb', 'flame', 'speed'];

// a collectable item sitting on a tile.
// Display-only: the server decides spawning, collection and stat changes.
export class PowerUp {
  constructor(id, x, y, type) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
  }
}

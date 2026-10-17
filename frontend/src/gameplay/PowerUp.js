// the three collectable power-up kinds
export const POWERUP_TYPES = ['bomb', 'flame', 'speed'];

// an item on the board, display only, the server owns spawning and collecting
export class PowerUp {
  constructor(id, x, y, type) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
  }
}

// the three collectable power-up kinds.
export const POWERUP_TYPES = ['bomb', 'flame', 'speed'];

// a collectable item sitting on a tile.
export class PowerUp {
  constructor(id, x, y, type) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
  }

  // raise the matching player stat by one step.
  applyTo(player) {
    if (this.type === 'bomb') player.addBomb();
    if (this.type === 'flame') player.addFlame();
    if (this.type === 'speed') player.addSpeed();
  }
}

// pick one of the three kinds at random.
export function randomType(random = Math.random) {
  const index = Math.floor(random() * POWERUP_TYPES.length);
  return POWERUP_TYPES[index];
}

// decide whether a destroyed block leaves a power-up behind.
export function shouldDrop(dropChance, random = Math.random) {
  return random() < dropChance;
}

// Holds all game data for display (the server is the source of truth).
export class GameState {
  constructor() {
    this.localPlayerId = null;
    this.map = null;

    // Active entities on the board
    this.players = new Map();
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.winner = null;
  }

  // Save the map sent by the server: { width, height, tiles }
  setMap(map) {
    if (Array.isArray(map)) {
      this.map = {
        width: map.reduce((w, t) => Math.max(w, t.x + 1), 0),
        height: map.reduce((h, t) => Math.max(h, t.y + 1), 0),
        tiles: map,
      };
    } else {
      this.map = map;
    }
  }

  // Reset all state when leaving or restarting a match
  reset() {
    this.localPlayerId = null;
    this.map = null;
    this.players.clear();
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.winner = null;
  }
}

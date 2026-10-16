export class GameState {
  constructor() {
    this.localPlayerId = null;
    this.map = null;

    // Active entities.
    this.players = new Map();
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.winner = null;
  }

  // Store the active map instance.
  setMap(map) {
    this.map = map;
  }

  // Reset all state when leaving or restarting a match.
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

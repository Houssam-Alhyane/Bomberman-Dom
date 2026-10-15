export class GameState {
  constructor() {
    this.status = 'LOBBY';
    this.localPlayerId = null;
    this.map = null;

    // Active entities.
    this.players = new Map();
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.winner = null;
  }

  // Add or update a player by ID.
  updatePlayer(id, data) {
    if (this.players.has(id)) {
      Object.assign(this.players.get(id), data);
    } else {
      this.players.set(id, { id, ...data });
    }
  }

  // Remove a player who left or died.
  removePlayer(id) {
    this.players.delete(id);
  }

  // Store the active map instance.
  setMap(map) {
    this.map = map;
  }

  // Reset all state when leaving or restarting a match.
  reset() {
    this.status = 'LOBBY';
    this.localPlayerId = null;
    this.map = null;
    this.players.clear();
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.winner = null;
  }
}

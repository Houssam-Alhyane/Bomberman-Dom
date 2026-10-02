class GameState {
  constructor() {
    this.players = new Map();
  }

  addPlayer(playerId) {
    this.players.set(playerId, {
      id: playerId,
      x: 1,
      y: 1,
      alive: true,
    });
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }
}

module.exports = GameState;

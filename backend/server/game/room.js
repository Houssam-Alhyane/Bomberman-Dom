const GameState = require('./state');

class Room {
  constructor(id) {
    this.id = id;
    this.state = new GameState();
  }

  addPlayer(playerId) {
    this.state.addPlayer(playerId);
  }

  removePlayer(playerId) {
    this.state.removePlayer(playerId);
  }

  getPlayers() {
    return this.state.getPlayers();
  }

  getPlayer(playerId) {
    return this.state.getPlayer(playerId);
  }
}

module.exports = Room;

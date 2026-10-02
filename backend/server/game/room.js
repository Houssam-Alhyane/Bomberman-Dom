class Room {
  constructor() {
    this.players = [];
    this.maxPlayers = 4;
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      return false;
    }

    this.players.push(player);
    return true;
  }

  removePlayer(playerId) {
    this.players = this.players.filter((player) => player.id !== playerId);
  }

  getPlayerCount() {
    return this.players.length;
  }

  isFull() {
    return this.players.length >= this.maxPlayers;
  }
}

module.exports = Room;

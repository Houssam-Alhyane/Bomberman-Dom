const MAX_PLAYERS = 4;

class Room {
  constructor() {
    this.id = null;
    this.name = null;
    this.players = [];
    this.maxPlayers = MAX_PLAYERS;
  }
  //take name of the first player in the players array and return it as the hostNickname
  get hostNickname() {
    const host = this.players[0];
    return host ? host.nickname : null;
  }

  addPlayer(player) {
    if (this.isFull()) {
      return false;
    }

    this.players.push(player);
    return true;
  }

  removePlayer(playerId) {
    const player = this.players.find((p) => p.id === playerId);

    if (!player) {
      return null;
    }
    //take all player with the same id and remove them from the players array
    this.players = this.players.filter((p) => p.id !== playerId);
    return player;
  }

  getPlayerCount() {
    return this.players.length;
  }

  isFull() {
    return this.players.length >= this.maxPlayers;
  }

  isEmpty() {
    return this.players.length === 0;
  }

  getPublicInfo() {
    return {
      id: this.id,
      name: this.name,
      hostNickname: this.hostNickname,
      players: this.getPlayerCount(),
      maxPlayers: this.maxPlayers,
    };
  }
}

module.exports = Room;
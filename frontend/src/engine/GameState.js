// the client's copy of the state, drawing only, the server is the truth

export class GameState {
  constructor() {
    this.localPlayerId = null;
    this.map = null;

    // everything currently on the board
    this.players = new Map();
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.winner = null;
  }

  // keep the map the server sent us
  setMap(map) {
    this.map = map;
  }

  // wipe everything when we leave or start a new match
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

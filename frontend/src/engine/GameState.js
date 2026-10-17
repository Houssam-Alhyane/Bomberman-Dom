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

  // keep the map the server sent us, normalised to { width, height, tiles }
  // so the board can be sized from the server's own dimensions
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

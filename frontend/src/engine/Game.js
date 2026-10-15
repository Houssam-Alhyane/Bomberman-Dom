import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { Performance } from './Performance.js';
import { Renderer } from './Renderer.js';
import { Map } from '../world/map/Map.js';
import { PlayerManager } from '../world/player/PlayerManager.js';
import { Input } from '../world/player/playerinput.js';
import { GRID_WIDTH, GRID_HEIGHT } from '../shared/constants.js';

// Coordinates the game engine subsystems and manages lifecycle.
export class GameEngine {
  constructor() {
    this.state = new GameState();
    this.performance = new Performance();
    this.renderer = null;
    this.players = new PlayerManager();
    this.input = new Input();
    this.onMove = null;

    this.loop = new GameLoop(
      () => this.update(),
      () => this.render(),
      this.performance
    );
  }

  init(container, { localPlayerId = 'local', players = [], map = [] } = {}) {
    this.destroy();
    this.state.reset();
    this.state.localPlayerId = localPlayerId;
    this.state.setMap(new Map(GRID_WIDTH, GRID_HEIGHT, map));

    // Fresh player list and key state for this match.
    this.players = new PlayerManager();
    this.input.reset();

    const list = players.length ? players : [{ id: localPlayerId, nickname: 'Player' }];
    list.forEach((player) => this.addPlayer(player.id, player.nickname));

    this.renderer = new Renderer(container);
  }

  // Add a player at the next free spawn tile.
  addPlayer(id, nickname) {
    const player = this.players.addPlayer(id, nickname);

    if (player) {
      this.state.players.set(id, player);
    }

    return player;
  }

  // Apply a position sent by the server for a remote player.
  setPlayerPosition(id, x, y) {
    const player = this.state.players.get(id);

    if (player) {
      player.x = x;
      player.y = y;
    }
  }

  // Start and stop the fixed-step game loop.
  start() {
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }

  // Move only the local player and report it so it can be broadcast.
  update() {
    const player = this.state.players.get(this.state.localPlayerId);
    if (!player || !this.state.map) return;

    const { dx, dy } = this.input.getDirection();
    if (!dx && !dy) return;

    const { x, y } = player;
    player.movement(dx, dy, this.state.map);

    if (player.x !== x || player.y !== y) {
      this.onMove?.(player);
    }
  }

  // Render the current game state into the DOM.
  render() {
    this.renderer?.render(this.state);
  }

  // Stop the loop and remove the board.
  destroy() {
    this.loop.stop();
    this.renderer?.destroy();
    this.renderer = null;
    this.players = new PlayerManager();
  }
}

export { GameEngine as Game };

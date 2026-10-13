import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { Performance } from './Performance.js';
import { Renderer } from './Renderer.js';
import { Map } from '../world/map/Map.js';
import { Player } from '../world/player/Player.js';
import { Keyboard } from '../input/Keyboard.js';
import { GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from '../shared/constants.js';

// Coordinates the game engine subsystems and manages lifecycle.
export class GameEngine {
  constructor(container = null) {
    this.state = new GameState();
    this.performance = new Performance();
    this.renderer = container ? new Renderer(container) : null;
    this.loop = new GameLoop(
      (step) => this.update(step),
      () => this.render(),
      this.performance
    );
    this.input = new Keyboard();
  }

  // Initialize the engine with a container element.
  init(container) {
    this.renderer = new Renderer(container);
    this.state.setMap(new Map(GRID_WIDTH, GRID_HEIGHT));

    // Spawn the local player at tile (1, 1).
    const player = new Player('local', 'Player', TILE_SIZE, TILE_SIZE);
    this.state.localPlayerId = player.id;
    this.state.players.set(player.id, player);
  }

  // Start the game loop.
  start() {
    this.loop.start();
  }

  // Stop the game loop.
  stop() {
    this.loop.stop();
  }

  // Update game logic on each fixed step.
  update() {
    const { dx, dy } = this.input.getDirection();
    if ((dx || dy) && this.state.map) {
      for (const player of this.state.players.values()) {
        player.movement(dx, dy, this.state.map);
      }
    }
  }

  // Render the current game state into the DOM.
  render() {
    if (this.renderer) {
      this.renderer.render(this.state);
    }
  }
}

export { GameEngine as Game };

import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { Performance } from './Performance.js';
import { Renderer } from './Renderer.js';

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
  }

  // Initialize the engine with a container element.
  init(container) {
    this.renderer = new Renderer(container);
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
  update(step) {
    // Subsystem update hook.
  }

  // Render the current game state into the DOM.
  render() {
    if (this.renderer) {
      this.renderer.render(this.state);
    }
  }
}

export { GameEngine as Game };

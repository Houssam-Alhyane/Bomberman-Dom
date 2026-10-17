// Runs the game loop: fixed updates (60/s) + smooth rendering via requestAnimationFrame.
export class GameLoop {
  constructor(update, render, performanceMonitor) {
    this.update = update;
    this.render = render;
    this.performance = performanceMonitor;

    // Fixed time step: 60 updates per second (approx 16.6ms)
    this.step = 1000 / 60;

    this._lastTime = 0;
    this._accumulator = 0;
    this._frameId = null;
    this._running = false;

    // Bind loop method to keep 'this' context
    this._loop = this._loop.bind(this);
  }

  // Start the game loop
  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._frameId = requestAnimationFrame(this._loop);
  }

  // Stop the game loop
  stop() {
    this._running = false;
    if (this._frameId !== null) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }

  // Main frame: run fixed updates, render, and schedule next frame
  _loop(now) {
    if (!this._running) return;

    // Time passed since last frame
    let delta = now - this._lastTime;
    this._lastTime = now;

    // Avoid spiral of death if tab was inactive (max 200ms)
    if (delta > 200) delta = 200;

    this._accumulator += delta;

    // Run fixed updates to catch up with elapsed time
    while (this._accumulator >= this.step) {
      this.update(this.step);
      this._accumulator -= this.step;
    }

    // Draw game on screen
    this.render();

    // Measure FPS
    this.performance.measure();

    // Schedule next frame
    this._frameId = requestAnimationFrame(this._loop);
  }
}

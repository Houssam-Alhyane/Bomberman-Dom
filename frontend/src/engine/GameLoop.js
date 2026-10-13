export class GameLoop {
  constructor(update, render, performanceMonitor) {
    this.update = update;
    this.render = render;
    this.performance = performanceMonitor;

    // Fixed step: 60 updates per second.
    this.step = 1000 / 60;

    this._lastTime = 0;
    this._accumulator = 0;
    this._frameId = null;
    this._running = false;

    // Bind once so we can pass it to rAF without creating a new function.
    this._loop = this._loop.bind(this);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._frameId = requestAnimationFrame(this._loop);
  }

  stop() {
    this._running = false;
    if (this._frameId !== null) {
      cancelAnimationFrame(this._frameId);
      this._frameId = null;
    }
  }

  _loop(now) {
    if (!this._running) return;

    // How much real time passed since last frame.
    let delta = now - this._lastTime;
    this._lastTime = now;

    // Cap delta to avoid spiral of death (e.g. tab was hidden).
    if (delta > 200) delta = 200;

    this._accumulator += delta;

    // Run fixed-step updates until we've caught up.
    while (this._accumulator >= this.step) {
      this.update(this.step);
      this._accumulator -= this.step;
    }

    // Render once per frame.
    this.render();

    // Measure FPS.
    this.performance.measure();

    // Schedule next frame.
    this._frameId = requestAnimationFrame(this._loop);
  }
}

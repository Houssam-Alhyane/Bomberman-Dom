export class Performance {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;

    this._frames = 0;
    this._lastSample = performance.now();
  }

  // Call once per frame.
  measure() {
    const now = performance.now();
    this._frames++;

    // Time since last sample.
    const elapsed = now - this._lastSample;

    // Update FPS every second.
    if (elapsed >= 1000) {
      this.fps = Math.round((this._frames * 1000) / elapsed);
      this.frameTime = +(elapsed / this._frames).toFixed(2);
      this._frames = 0;
      this._lastSample = now;
    }
  }

  getStats() {
    return { fps: this.fps, frameTime: this.frameTime };
  }
}

// Measures FPS (frames per second) and frame render time.
export class Performance {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;

    this._frames = 0;
    this._lastSample = performance.now();
  }

  // Count frames and calculate FPS every 1 second
  measure() {
    const now = performance.now();
    this._frames++;

    const elapsed = now - this._lastSample;

    // Update FPS once every second (1000ms)
    if (elapsed >= 1000) {
      this.fps = Math.round((this._frames * 1000) / elapsed);
      this.frameTime = +(elapsed / this._frames).toFixed(2);
      this._frames = 0;
      this._lastSample = now;
    }
  }
}

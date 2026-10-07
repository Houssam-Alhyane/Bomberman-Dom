export class GameLoop {
    constructor(update, render, performanceMonitor) {
        this.update = update;
        this.render = render;
        this.performance = performanceMonitor;
        this.lastTime = 0;
        this.accumulator = 0;
        this.step = 1000 / 60; 
        this.isRunning = false;
        this.animationFrameId = null;
    }
}